import { Request, Response, Application } from "express";
import multer from "multer";
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
  // Upload hero video — direct multipart, no base64 corruption
  app.post("/api/upload/hero-video", upload.single("video"), async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    if (!req.file) { res.status(400).json({ error: "No se recibió ningún archivo" }); return; }
    try {
      const safeName = req.file.originalname.replace(/[^a-z0-9._-]/gi, "_");
      const key = `hero-videos/${Date.now()}-${safeName}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      await updateSiteConfig("hero_video_url", url);
      res.json({ success: true, url });
    } catch (err) {
      console.error("[upload/hero-video]", err);
      res.status(500).json({ error: "Error al subir el video" });
    }
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

  // Upload a single media asset for the independent promo carousel
  app.post("/api/upload/promo-carousel-media", upload.single("media"), async (req: Request, res: Response) => {
    if (!await requireAdmin(req, res)) return;
    if (!req.file) { res.status(400).json({ error: "No se recibió ningún archivo" }); return; }
    try {
      const safeName = req.file.originalname.replace(/[^a-z0-9._-]/gi, "_");
      const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
      const key = `promo-carousel/${mediaType}s/${Date.now()}-${safeName}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ success: true, url, mediaType });
    } catch (err) {
      console.error("[upload/promo-carousel-media]", err);
      res.status(500).json({ error: "Error al subir el medio promocional" });
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
