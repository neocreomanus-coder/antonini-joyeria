import express, { type Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.use(
    "/manus-storage",
    express.static(ENV.storageDir, {
      dotfiles: "deny",
      fallthrough: true,
      maxAge: "30d",
      immutable: false,
    }),
    (_req, res) => {
      res.status(404).send("Archivo no encontrado");
    },
  );
}
