import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { boxfulError } from "./config";

function key(name: string, purpose: string) {
  const secret = process.env[name];
  if (!secret || secret.length < 32) throw boxfulError("CONFIG_MISSING");
  return createHash("sha256").update(`${purpose}\0${secret}`).digest();
}
export function seal(value: unknown, name: string, purpose: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(name, purpose), iv);
  cipher.setAAD(Buffer.from(purpose));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function unseal(value: string, name: string, purpose: string): unknown {
  try {
    if (value.length > 100_000) throw boxfulError();
    const bytes = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(name, purpose), bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(purpose));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
  } catch { throw boxfulError(); }
}
