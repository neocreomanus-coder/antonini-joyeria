import express, { type Express, type Request, type Response } from "express";
import { ENV } from "./env";
import { storageGetR2Object } from "../storage";

async function bodyToBuffer(body: any): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);

  if (typeof body.transformToByteArray === "function") {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  const chunks: Buffer[] = [];

  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export function registerStorageProxy(app: Express) {
  app.use(
    "/manus-storage",

    // 1. Primero servir archivos antiguos/locales del VPS.
    express.static(ENV.storageDir, {
      dotfiles: "deny",
      fallthrough: true,
      maxAge: "30d",
      immutable: false,
    }),

    // 2. Si no está localmente, buscar el objeto en Cloudflare R2.
    async (req: Request, res: Response) => {
      try {
        let key: string;

        try {
          key = decodeURIComponent(req.path).replace(/^\/+/, "");
        } catch {
          res.status(400).send("Ruta de archivo inválida");
          return;
        }

        if (!key) {
          res.status(404).send("Archivo no encontrado");
          return;
        }

        const requestedRange =
          typeof req.headers.range === "string"
            ? req.headers.range
            : undefined;

        const result = await storageGetR2Object(key, requestedRange);

        if (!result) {
          res.status(404).send("Archivo no encontrado");
          return;
        }

        const { object } = result;
        const buffer = await bodyToBuffer(object.Body);

        if (object.ContentType) {
          res.setHeader("Content-Type", object.ContentType);
        }

        res.setHeader(
          "Cache-Control",
          object.CacheControl ?? "public, max-age=2592000",
        );

        if (object.ETag) {
          res.setHeader("ETag", object.ETag);
        }

        if (object.LastModified) {
          res.setHeader("Last-Modified", object.LastModified.toUTCString());
        }

        res.setHeader("Accept-Ranges", "bytes");

        if (requestedRange && object.ContentRange) {
          res.status(206);

          res.setHeader("Content-Range", object.ContentRange);

          if (typeof object.ContentLength === "number") {
            res.setHeader("Content-Length", String(object.ContentLength));
          }

          res.send(buffer);
          return;
        }

        if (typeof object.ContentLength === "number") {
          res.setHeader("Content-Length", String(object.ContentLength));
        }

        res.status(200).send(buffer);
      } catch (error) {
        console.error("[storage-proxy]", error);
        res.status(500).send("Error cargando archivo");
      }
    },
  );
}
