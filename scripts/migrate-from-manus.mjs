#!/usr/bin/env node
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const TABLES = [
  "users",
  "categories",
  "products",
  "product_variants",
  "cart_items",
  "orders",
  "order_items",
  "testimonials",
  "newsletter_subscribers",
  "site_config",
];

const configPathArg = process.argv[2];
let manusConfig = null;
if (configPathArg) {
  const configPath = path.resolve(configPathArg);
  manusConfig = JSON.parse(await fsp.readFile(configPath, "utf8"));
  console.log(`📦 Configuración de origen cargada desde: ${configPath}`);
}

const sourceDatabaseUrl =
  process.env.OLD_DATABASE_URL ||
  manusConfig?.env_vars?.DATABASE_URL ||
  manusConfig?.env_vars?.DRIZZLE_DATABASE_URL;
const forgeApiUrl =
  process.env.OLD_FORGE_API_URL ||
  manusConfig?.secrets?.BUILT_IN_FORGE_API_URL;
const forgeApiKey =
  process.env.OLD_FORGE_API_KEY ||
  manusConfig?.secrets?.BUILT_IN_FORGE_API_KEY;
const targetDatabaseUrl = process.env.DATABASE_URL;
const storageDir = path.resolve(process.env.STORAGE_DIR || "./storage");

if (!sourceDatabaseUrl) throw new Error("No se encontró la DATABASE_URL de Manus. Pasa la ruta a .project-config.json o define OLD_DATABASE_URL.");
if (!targetDatabaseUrl) throw new Error("DATABASE_URL del nuevo servidor no está definida en .env");
if (!forgeApiUrl || !forgeApiKey) throw new Error("No se encontraron las credenciales de almacenamiento Forge de Manus.");

function connectionOptions(urlString) {
  const url = new URL(urlString);
  const sslValue = url.searchParams.get("ssl");
  let ssl;
  if (sslValue && !["false", "0", "disabled"].includes(sslValue.toLowerCase())) {
    try {
      const parsed = JSON.parse(sslValue);
      ssl = { rejectUnauthorized: parsed?.rejectUnauthorized !== false };
    } catch {
      ssl = { rejectUnauthorized: true };
    }
  }
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    charset: "utf8mb4",
    ...(ssl ? { ssl } : {}),
  };
}

function connectionIdentity(urlString) {
  const url = new URL(urlString);
  return `${url.hostname}:${url.port || 3306}/${url.pathname.replace(/^\//, "")}`;
}

if (connectionIdentity(sourceDatabaseUrl) === connectionIdentity(targetDatabaseUrl)) {
  throw new Error("La base de origen y la base de destino parecen ser la misma. Migración cancelada por seguridad.");
}

const source = await mysql.createConnection(connectionOptions(sourceDatabaseUrl));
const target = await mysql.createConnection(connectionOptions(targetDatabaseUrl));

const sourceRowsByTable = new Map();

async function getColumns(connection, table) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
  return rows.map(row => row.Field);
}

async function copyDatabase() {
  console.log("\n🗄️  Copiando datos de Manus a la nueva MariaDB/MySQL...");
  await target.query("SET FOREIGN_KEY_CHECKS=0");
  try {
    for (const table of [...TABLES].reverse()) {
      await target.query(`DELETE FROM \`${table}\``);
    }

    for (const table of TABLES) {
      const [sourceRows] = await source.query(`SELECT * FROM \`${table}\``);
      sourceRowsByTable.set(table, sourceRows);

      if (sourceRows.length === 0) {
        console.log(`   ${table}: 0 registros`);
        continue;
      }

      const sourceColumns = await getColumns(source, table);
      const targetColumns = new Set(await getColumns(target, table));
      const columns = sourceColumns.filter(column => targetColumns.has(column));
      if (columns.length === 0) throw new Error(`No hay columnas compatibles para ${table}`);

      const quotedColumns = columns.map(column => `\`${column}\``).join(",");
      const chunkSize = 100;
      for (let i = 0; i < sourceRows.length; i += chunkSize) {
        const chunk = sourceRows.slice(i, i + chunkSize);
        const rowPlaceholder = `(${columns.map(() => "?").join(",")})`;
        const placeholders = chunk.map(() => rowPlaceholder).join(",");
        const values = chunk.flatMap(row =>
          columns.map(column => {
            const value = row[column];

            if (
              value === null ||
              value === undefined ||
              Buffer.isBuffer(value) ||
              value instanceof Date
            ) {
              return value;
            }

            return typeof value === "object"
              ? JSON.stringify(value)
              : value;
          })
        );
        await target.query(
          `INSERT INTO \`${table}\` (${quotedColumns}) VALUES ${placeholders}`,
          values,
        );
      }
      console.log(`   ${table}: ${sourceRows.length} registros ✅`);
    }
  } finally {
    await target.query("SET FOREIGN_KEY_CHECKS=1");
  }
  console.log("✅ Base de datos migrada.");
}

const storageKeys = new Set();
const storageRegex = /\/manus-storage\/([A-Za-z0-9][A-Za-z0-9._/-]*)/g;

function collectKeysFromString(value) {
  if (typeof value !== "string") return;
  let match;
  while ((match = storageRegex.exec(value)) !== null) {
    const key = match[1].split("?")[0].split("#")[0];
    if (key && !key.split("/").includes("..")) storageKeys.add(key);
  }
  storageRegex.lastIndex = 0;
}

function collectKeysFromValue(value) {
  if (value == null) return;
  if (typeof value === "string") {
    collectKeysFromString(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectKeysFromValue(item);
    return;
  }
  if (typeof value === "object" && !Buffer.isBuffer(value) && !(value instanceof Date)) {
    for (const item of Object.values(value)) collectKeysFromValue(item);
  }
}

async function scanProjectFiles(dir) {
  const skip = new Set(["node_modules", "dist", "storage", ".git", ".webdev"]);
  const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".html", ".css", ".json"]);
  for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanProjectFiles(full);
    } else if (extensions.has(path.extname(entry.name))) {
      collectKeysFromString(await fsp.readFile(full, "utf8"));
    }
  }
}

async function getSignedUrl(key) {
  const endpoint = new URL("v1/storage/presign/get", forgeApiUrl.replace(/\/+$/, "") + "/");
  endpoint.searchParams.set("path", key);
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${forgeApiKey}` },
  });
  if (!response.ok) throw new Error(`presign ${response.status}`);
  const body = await response.json();
  if (!body?.url) throw new Error("presign sin URL");
  return body.url;
}

async function downloadStorage() {
  console.log("\n🖼️  Buscando imágenes y videos referenciados...");
  for (const rows of sourceRowsByTable.values()) {
    for (const row of rows) collectKeysFromValue(row);
  }
  await scanProjectFiles(process.cwd());
  console.log(`   ${storageKeys.size} archivos únicos detectados.`);
  await fsp.mkdir(storageDir, { recursive: true });

  const keys = [...storageKeys];
  let completed = 0;
  let skipped = 0;
  const failures = [];
  const concurrency = 4;
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= keys.length) return;
      const key = keys[index];
      const destination = path.resolve(storageDir, key);
      if (destination !== storageDir && !destination.startsWith(storageDir + path.sep)) {
        failures.push({ key, error: "ruta inválida" });
        continue;
      }
      try {
        const stat = await fsp.stat(destination).catch(() => null);
        if (stat?.size > 0) {
          skipped++;
          continue;
        }
        const signedUrl = await getSignedUrl(key);
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error(`descarga ${response.status}`);
        const bytes = Buffer.from(await response.arrayBuffer());
        await fsp.mkdir(path.dirname(destination), { recursive: true });
        await fsp.writeFile(destination, bytes);
        completed++;
        process.stdout.write(`\r   Descargados: ${completed} | existentes: ${skipped} | fallidos: ${failures.length}`);
      } catch (error) {
        failures.push({ key, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  process.stdout.write("\n");
  console.log(`✅ Multimedia: ${completed} descargados, ${skipped} ya existentes, ${failures.length} fallidos.`);
  if (failures.length) {
    const reportPath = path.join(storageDir, "migration-failures.json");
    await fsp.writeFile(reportPath, JSON.stringify(failures, null, 2));
    console.warn(`⚠️  Revisa ${reportPath}. Algunos archivos antiguos pueden no existir ya en Manus.`);
  }
}

try {
  await copyDatabase();
  await downloadStorage();
  console.log("\n🎉 Migración terminada. Ya puedes retirar las credenciales de Manus del servidor.");
} finally {
  await Promise.allSettled([source.end(), target.end()]);
}
