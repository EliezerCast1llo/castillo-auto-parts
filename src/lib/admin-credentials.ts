/**
 * admin-credentials.ts
 *
 * Hashing y verificación de contraseñas para usuarios admin.
 * Usa Node.js built-in `crypto.scrypt` — sin dependencias externas.
 *
 * Formato almacenado: `{saltBase64url}:{hashBase64url}`
 * Parámetros scrypt: N=16384, r=8, p=1, keyLen=64 (64 bytes = 512 bits)
 */

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_OPTS = { N: 16_384, r: 8, p: 1 };
const KEY_LEN = 64;
const SALT_LEN = 16;

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, SCRYPT_OPTS, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const hash = await scryptAsync(plain, salt);
  return `${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const separatorIndex = stored.indexOf(":");
  if (separatorIndex === -1) return false;

  const saltB64 = stored.slice(0, separatorIndex);
  const hashB64 = stored.slice(separatorIndex + 1);

  if (!saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scryptAsync(plain, salt);

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
