#!/usr/bin/env node
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD;
const email = process.env.ADMIN_EMAIL || "admin@antonini.local";
const name = process.env.ADMIN_NAME || "Administrador";

if (!DATABASE_URL) throw new Error("DATABASE_URL no está definido");
if (!password || password.length < 12) throw new Error("ADMIN_PASSWORD debe tener al menos 12 caracteres");

function connectionOptions(urlString) {
  const url = new URL(urlString);
  const sslEnabled = ["true", "1", "required"].includes((url.searchParams.get("ssl") || "").toLowerCase());
  return {
    host: url.hostname,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    port: Number(url.port || 3306),
    ...(sslEnabled ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}

const connection = await mysql.createConnection(connectionOptions(DATABASE_URL));
try {
  const passwordHash = await bcrypt.hash(password, 12);
  const [rows] = await connection.execute("SELECT id, openId FROM users WHERE username = ? LIMIT 1", [username]);
  if (rows.length) {
    await connection.execute(
      "UPDATE users SET passwordHash=?, email=?, name=?, loginMethod='manual', role='admin', updatedAt=NOW() WHERE id=?",
      [passwordHash, email, name, rows[0].id],
    );
    console.log(`✅ Administrador actualizado: ${username}`);
  } else {
    const openId = `admin-${username}-${Date.now()}`;
    await connection.execute(
      "INSERT INTO users (username,passwordHash,email,name,openId,loginMethod,role) VALUES (?,?,?,?,?,'manual','admin')",
      [username, passwordHash, email, name, openId],
    );
    console.log(`✅ Administrador creado: ${username}`);
  }
} finally {
  await connection.end();
}
