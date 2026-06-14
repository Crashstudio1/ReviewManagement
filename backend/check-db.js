import "dotenv/config";
import { dbName, pool } from "./db.js";

const host = process.env.DB_HOST || "127.0.0.1";
const port = process.env.DB_PORT || "3306";

try {
  await pool.query("SELECT 1 AS connected");
  console.log(`Database connection OK: ${dbName} at ${host}:${port}`);
} catch (error) {
  console.error(`Database connection failed: ${dbName} at ${host}:${port}`);
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
