/** One-time backfill for the active hero on the isolated V2 test DB only. */
import { access } from "node:fs/promises";
import sharp from "sharp";
import path from "node:path";
import { getHeroConfig, updateSiteConfig } from "../server/db";
import { optimizeExistingHeroVideo } from "../server/heroMedia";
import { ENV } from "../server/_core/env";

async function main() {
  const selectedDatabase = new URL(process.env.DATABASE_URL ?? "mysql://x:x@localhost/unknown").pathname.slice(1);
  if (selectedDatabase !== "antonini_oct11_test") {
    throw new Error("Este comando solo se puede utilizar sobre antonini_oct11_test");
  }
  const hero = await getHeroConfig();
  if (!hero.videoUrl?.startsWith("/manus-storage/")) {
    throw new Error("El hero de pruebas no apunta a un archivo local del almacenamiento habitual");
  }
  if (hero.posterUrl && /\/hero-videos\/\d+-[a-f0-9]+\.mp4$/.test(hero.videoUrl)) {
    // Skip only when an existing poster has meaningful visual content.
    try {
      if (hero.posterUrl.startsWith("/manus-storage/")) {
        const existingPoster = path.resolve(ENV.storageDir, hero.posterUrl.slice("/manus-storage/".length));
        const stats = await sharp(existingPoster).resize(96, 96, { fit: "fill" }).stats();
        const channels = stats.channels.slice(0, 3);
        const contrast = channels.reduce((sum, channel) => sum + channel.stdev, 0) / Math.max(1, channels.length);
        if (contrast >= 10) {
          console.log("El hero ya tiene una portada válida. No se modifica.");
          return;
        }
        console.log("La portada existente está vacía o es uniforme. Volviendo a optimizar...");
      }
    } catch {
      console.log("La portada existente no está disponible localmente. Volviendo a optimizar...");
    }
  }
  const root = path.resolve(ENV.storageDir);
  const full = path.resolve(root, hero.videoUrl.slice("/manus-storage/".length));
  if (!full.startsWith(`${root}${path.sep}`)) throw new Error("Ruta del video inválida");
  await access(full);
  console.log("Optimizando el video actualmente configurado en pruebas...");
  const optimized = await optimizeExistingHeroVideo(full);
  // Publish poster first, then video. Production DB is not connected here.
  await updateSiteConfig("hero_poster_url", optimized.posterUrl);
  await updateSiteConfig("hero_video_url", optimized.url);
  console.log("Video optimizado:", optimized.url);
  console.log("Portada optimizada:", optimized.posterUrl);
}

// The CLI should exit after writing the configuration: drizzle's MySQL pool
// otherwise keeps an idle connection open indefinitely in this one-off script.
main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
