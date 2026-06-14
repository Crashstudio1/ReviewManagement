import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const runtimeJwtSecret = randomBytes(32).toString("base64url");

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function getJwtSecret() {
  return process.env.JWT_SECRET || runtimeJwtSecret;
}

export function getJwtTtlSeconds() {
  const configured = Number(process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 8);
  return Number.isFinite(configured) && configured > 0 ? configured : 60 * 60 * 8;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const key = await scrypt(String(password), salt, 64);
  return `scrypt$${salt}$${key.toString("base64url")}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  const [scheme, salt, expected] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;

  try {
    const key = await scrypt(String(password), salt, 64);
    const expectedBuffer = Buffer.from(expected, "base64url");
    return key.length === expectedBuffer.length && timingSafeEqual(key, expectedBuffer);
  } catch {
    return false;
  }
}

export function signJwt(payload, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = Number(options.expiresIn || getJwtTtlSeconds());
  const header = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };
  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(body)}`;
  const signature = createHmac("sha256", getJwtSecret()).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifyJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expected = createHmac("sha256", getJwtSecret()).update(unsigned).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || Number(payload.exp) < now) return null;
    return payload;
  } catch {
    return null;
  }
}
