import { Request, Response, Application } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import os from "node:os";
import { rm } from "node:fs/promises";
import { queueHeroVideo, heroJobStatus } from "./heroMedia";
import { storagePut } from "./storage";
import { getUserByOpenId, updateSiteConfig } from "./db";
import { sdk } from "./_core/sdk";

const allowedMediaTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// Memory storage — file goes straight to buffer, no disk writes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (_req, file, cb) => {
    cb(null, allowedMediaTypes.includes(file.mimetype));
  },
});

// Upload large hero videos to disk; never buffer a 60–500 MB video in Node memory.
const heroUpload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_req, _file, cb) => cb(null, `antonini-hero-upload-${randomUUID()}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("video/")),
});

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) { res.status(401).json({ error: "No autenticado" }); return false; }
    const storedUser = await getUserByOpenId(user.openId);
    if (storedUser?.role !== "admin") { res.status(403).json({ error: "Solo administradores" }); return false; }
    return true;
  } catch {
    res.status(401).json({ error: "Sesión inválida" });
    return false;
  }
}

export function registerUploadRoutes(app: Application) {
  // Authenticate before accepting potentially large multipart uploads.
  app.post("/api/upload/hero-video", async (req, res, next) => {
    if (await requireAdmin(req, res)) next();
  }, heroUpload.single("video"), async (req: Request, res: Response) => {
    if (!req.file?.path) { res.status(400).json({ error: "Selecciona un archivo de video" }); return; }
    const jobId = queueHeroVideo(req.file.path);
    if (!jobId) {
      await rm(req.file.path, { force: true });
      res.status(409).json({ error: "Ya se está optimizando otro video. Espera a que finalice." });
      return;
    }
    res.status(202).json({ jobId, state: "processing" });
  });

  app.get("/api/upload/hero-video/status/:jobId", async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    const job = heroJobStatus(String(req.params.jobId));
    if (!job) { res.status(404).json({ error: "Proceso no encontrado. Vuelve a subir el video." }); return; }
    res.json(job);
  });

  // Upload hero fallback image
  app.post("/api/upload/hero-image", upload.single("image"), async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    if (!req.file) { res.status(400).json({ error: "No se recibió ningún archivo" }); return; }
    try {
      const safeName = req.file.originalname.replace(/[^a-z0-9._-]/gi, "_");
      const key = `hero-images/${Date.now()}-${safeName}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      await updateSiteConfig("hero_fallback_image", url);
      res.json({ success: true, url });
    } catch (err) {
      console.error("[upload/hero-image]", err);
      res.status(500).json({ error: "Error al subir la imagen" });
    }
  });

  // Upload product image — avoids base64 payload limits in tRPC for photos from mobile devices
  app.post("/api/upload/product-image", upload.single("image"), async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    if (!req.file) { res.status(400).json({ error: "Selecciona una imagen JPG, PNG, WEBP o HEIC" }); return; }
    try {
      const safeName = req.file.originalname.replace(/[^a-z0-9._-]/gi, "_");
      const key = `products/${Date.now()}-${safeName}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ success: true, url, key });
    } catch (err) {
      console.error("[upload/product-image]", err);
      res.status(500).json({ error: "No fue posible subir la imagen. Inténtalo de nuevo." });
    }
  });

  // Upload an image for the Entregas Seguras gallery
  app.post("/api/upload/delivery-photo", upload.single("image"), async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    if (!req.file) { res.status(400).json({ error: "Selecciona una imagen JPG, PNG o WEBP" }); return; }
    if (!req.file.mimetype.startsWith("image/")) { res.status(400).json({ error: "Solo se permiten imágenes" }); return; }
    try {
      const safeName = req.file.originalname.replace(/[^a-z0-9._-]/gi, "_");
      const key = `delivery-photos/${Date.now()}-${safeName}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ success: true, url });
    } catch (err) {
      console.error("[upload/delivery-photo]", err);
      res.status(500).json({ error: "No fue posible subir la imagen de entrega" });
    }
  });
}
