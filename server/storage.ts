import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ENV } from "./_core/env";

function normalizeKey(relKey: string): string {
  const key = relKey.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!key || key.split("/").some(part => part === "..")) {
    throw new Error("Invalid storage key");
  }
  return key;
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function resolveStoragePath(key: string): string {
  const root = ENV.storageDir;
  const fullPath = path.resolve(root, key);
  if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
    throw new Error("Invalid storage path");
  }
  return fullPath;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const fullPath = resolveStoragePath(key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  const payload = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  await fs.writeFile(fullPath, payload);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/manus-storage/${key}`;
}
