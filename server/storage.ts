import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
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

  if (lastDot === -1) {
    return `${relKey}_${hash}`;
  }

  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function replaceExtension(relKey: string, extension: string): string {
  const slashIndex = relKey.lastIndexOf("/");
  const dotIndex = relKey.lastIndexOf(".");

  if (dotIndex > slashIndex) {
    return `${relKey.slice(0, dotIndex)}${extension}`;
  }

  return `${relKey}${extension}`;
}

function resolveStoragePath(key: string): string {
  const root = ENV.storageDir;
  const fullPath = path.resolve(root, key);

  if (fullPath !== root && !fullPath.startsWith(root + path.sep)) {
    throw new Error("Invalid storage path");
  }

  return fullPath;
}

function isR2Configured(): boolean {
  return Boolean(
    ENV.r2Endpoint &&
      ENV.r2AccessKeyId &&
      ENV.r2SecretAccessKey &&
      ENV.r2Bucket,
  );
}

let r2Client: S3Client | null = null;

function getR2Client(): S3Client | null {
  if (!isR2Configured()) {
    return null;
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: ENV.r2Endpoint,
      credentials: {
        accessKeyId: ENV.r2AccessKeyId,
        secretAccessKey: ENV.r2SecretAccessKey,
      },
    });
  }

  return r2Client;
}

async function optimizeImage(
  originalKey: string,
  payload: Buffer,
  contentType: string,
): Promise<{
  key: string;
  payload: Buffer;
  contentType: string;
}> {
  if (!contentType.toLowerCase().startsWith("image/")) {
    return {
      key: originalKey,
      payload,
      contentType,
    };
  }

  try {
    const optimized = await sharp(payload)
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 88,
        effort: 4,
      })
      .toBuffer();

    return {
      key: replaceExtension(originalKey, ".webp"),
      payload: optimized,
      contentType: "image/webp",
    };
  } catch (error) {
    console.warn(
      `[storage] No se pudo optimizar ${originalKey}; se guardará el original.`,
      error,
    );

    return {
      key: originalKey,
      payload,
      contentType,
    };
  }
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const normalizedKey = normalizeKey(relKey);

  const originalPayload =
    typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  const processed = await optimizeImage(
    normalizedKey,
    originalPayload,
    contentType,
  );

  const key = appendHashSuffix(normalizeKey(processed.key));
  const client = getR2Client();

  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: ENV.r2Bucket,
        Key: key,
        Body: processed.payload,
        ContentType: processed.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    console.log(
      `[storage] R2 upload: ${key} (${originalPayload.length} -> ${processed.payload.length} bytes)`,
    );
  } else {
    const fullPath = resolveStoragePath(key);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, processed.payload);

    console.log(
      `[storage] Local upload: ${key} (${originalPayload.length} -> ${processed.payload.length} bytes)`,
    );
  }

  return {
    key,
    url: `/manus-storage/${key}`,
  };
}

export async function storageGet(
  relKey: string,
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  return {
    key,
    url: `/manus-storage/${key}`,
  };
}

export async function storageGetSignedUrl(
  relKey: string,
): Promise<string> {
  const key = normalizeKey(relKey);
  return `/manus-storage/${key}`;
}

export async function storageGetR2Object(
  relKey: string,
  range?: string,
): Promise<{ key: string; object: GetObjectCommandOutput } | null> {
  const client = getR2Client();

  if (!client) {
    return null;
  }

  const key = normalizeKey(relKey);

  try {
    const object = await client.send(
      new GetObjectCommand({
        Bucket: ENV.r2Bucket,
        Key: key,
        Range: range,
      }),
    );

    return { key, object };
  } catch (error: any) {
    const status = error?.$metadata?.httpStatusCode;

    if (
      status === 404 ||
      error?.name === "NoSuchKey" ||
      error?.name === "NotFound"
    ) {
      return null;
    }

    throw error;
  }
}
