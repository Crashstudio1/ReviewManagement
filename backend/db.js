import "dotenv/config";
import mysql from "mysql2/promise";

export const dbName = process.env.DB_NAME || "government_citizen_review";

export function createPool({ withDatabase = true } = {}) {
  return mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: withDatabase ? dbName : undefined,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    namedPlaceholders: true,
  });
}

export const pool = createPool();
