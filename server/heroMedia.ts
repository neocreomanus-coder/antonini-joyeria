/**
 * Automatic hero video pipeline: uploaded files are written to temporary disk,
 * transcoded in a bounded child process, and published only after optimization.
 * Both optimized media assets are uploaded through Antonini's existing R2
 * storage layer; an additional local video cache enables fast ranged serving.
 */
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { storagePut } from "./storage";
import { ENV } from "./_core/env";

type HeroJob =
  | { state: "processing" }
  | { state: "ready"; url: string; posterUrl: string }
  | { state: "failed"; error: string };

const jobs = new Map<string, HeroJob>();
let activeJob: string | null = null;

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-nostdin", "-loglevel", "error", "-y", ...args], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => { stderr = (stderr + String(chunk)).slice(-1600); });
    let timedOut = false;
    const limit = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, 10 * 60 * 1000);
    child.once("error", error => { clearTimeout(limit); reject(error); });
    child.once("close", code => {
      clearTimeout(limit);
      if (code === 0 && !timedOut) resolve();
      else reject(new Error(timedOut ? "El video superó el tiempo máximo de procesamiento" : `ffmpeg: ${stderr || `salió con código ${code}`}`));
    });
  });
}

/**
 * Find the earliest meaningful frame. Video messages often start with one or
 * several black frames; a 0-second thumbnail would make the hero look broken.
 * Return the selected timestamp so the encoded MP4 starts on the *same* scene
 * used for its poster (avoids poster-to-black flicker).
 */
async function selectVisibleStart(src: string, workDir: string): Promise<number> {
  const duration = await new Promise<number>((resolve) => {
    const child = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", src], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    let data = "";
    child.stdout?.on("data", (chunk: Buffer) => { data += String(chunk).slice(0, 100); });
    child.once("error", () => resolve(Infinity));
    child.once("close", () => {
      const n = Number(data.trim());
      resolve(Number.isFinite(n) && n > 0 ? n : Infinity);
    });
  });

  const timestamps = [0.15, 0.4, 0.8, 1.3, 2, 3, 4.5, 6.5, 9, 12, 17, 24, 32];
  let best = { time: 0.15, score: -1 };
  for (const time of timestamps) {
    if (time >= duration - 0.08) break;
    const frame = path.join(workDir, `sample-${String(time).replace(".", "-")}.jpg`);
    try {
      await runFfmpeg(["-ss", String(time), "-i", src, "-vf", "scale=w='min(480,iw)':h=-2", "-frames:v", "1", "-q:v", "4", frame]);
      const stats = await sharp(frame).resize(96, 96, { fit: "fill" }).stats();
      const rgb = stats.channels.slice(0, 3);
      if (rgb.length < 3) continue;
      const contrast = rgb.reduce((total, channel) => total + channel.stdev, 0) / 3;
      const brightness = rgb.reduce((total, channel) => total + channel.mean, 0) / 3;
      // Flat black, white, and monochrome intro frames are not usable posters.
      const score = contrast - (brightness < 18 || brightness > 242 ? 25 : 0);
      if (score > best.score) best = { time, score };
      if (contrast >= 10 && brightness >= 18 && brightness <= 242) {
        console.log(`[hero-video] Primer fotograma útil: ${time}s (contraste ${contrast.toFixed(1)})`);
        return time;
      }
    } catch (error) {
      console.warn(`[hero-video] No se pudo examinar el segundo ${time}:`, error instanceof Error ? error.message : String(error));
    }
  }
  console.warn(`[hero-video] No se encontró un fotograma claramente contrastado; se utilizará ${best.time}s.`);
  return best.time;
}

function localCachePath(key: string): string {
  const root = path.resolve(ENV.storageDir);
  const resolved = path.resolve(root, key);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("Ruta de almacenamiento no válida");
  return resolved;
}

async function optimizeAndStore(src: string): Promise<{ url: string; posterUrl: string }> {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "antonini-hero-work-"));
  const videoPath = path.join(workDir, "hero.mp4");
  const posterPath = path.join(workDir, "poster.jpg");
  try {
    const visibleStart = await selectVisibleStart(src, workDir);
    await runFfmpeg([
      "-ss", String(visibleStart), "-i", src, "-map", "0:v:0", "-vf", "scale=w='min(1600,iw)':h=-2:flags=lanczos,fps=30",
      "-c:v", "libx264", "-threads", "2", "-preset", "medium", "-crf", "19",
      "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", videoPath,
    ]);
    // Extract the poster from the chosen visible source frame. The optimized
    // video begins at the same timestamp, eliminating the black transition.
    await runFfmpeg(["-ss", String(visibleStart), "-i", src, "-frames:v", "1", "-q:v", "3", posterPath]);

    const stamp = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    const videoBuffer = await readFile(videoPath);
    const posterBuffer = await sharp(await readFile(posterPath))
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 }).toBuffer();

    const savedPoster = await storagePut(`hero-posters/${stamp}.webp`, posterBuffer, "image/webp");
    // The poster is tiny: local cache guarantees that first-frame preloads do not wait for R2.
    const localPoster = localCachePath(savedPoster.key);
    await mkdir(path.dirname(localPoster), { recursive: true });
    await writeFile(localPoster, posterBuffer);

    const savedVideo = await storagePut(`hero-videos/${stamp}.mp4`, videoBuffer, "video/mp4");
    const localVideo = localCachePath(savedVideo.key);
    await mkdir(path.dirname(localVideo), { recursive: true });
    await copyFile(videoPath, localVideo);

    return { url: savedVideo.url, posterUrl: savedPoster.url };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Used by the one-time migration helper, without changing currently published media. */
export async function optimizeExistingHeroVideo(filePath: string) {
  return optimizeAndStore(filePath);
}

export function queueHeroVideo(filePath: string): string | null {
  if (activeJob) return null;
  const jobId = randomUUID();
  activeJob = jobId;
  jobs.set(jobId, { state: "processing" });
  void optimizeAndStore(filePath)
    .then(media => jobs.set(jobId, { state: "ready", ...media }))
    .catch(error => {
      console.error("[hero-video] Error optimizando", error);
      jobs.set(jobId, { state: "failed", error: "No se pudo procesar el video; revisa su formato e inténtalo de nuevo." });
    })
    .finally(() => {
      activeJob = null;
      void rm(filePath, { force: true });
      setTimeout(() => jobs.delete(jobId), 30 * 60 * 1000).unref();
    });
  return jobId;
}

export function heroJobStatus(jobId: string): HeroJob | null {
  return jobs.get(jobId) ?? null;
}
