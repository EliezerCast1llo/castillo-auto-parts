import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const ADMIN_SESSION_VERSION = "v1";
const CLOCK_SKEW_SECONDS = 60;

export function createAdminSessionToken(secret: string, nowMs = Date.now()) {
  const issuedAt = Math.floor(nowMs / 1000).toString();
  const signature = signAdminSession(issuedAt, secret);

  return `${ADMIN_SESSION_VERSION}.${issuedAt}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined, secret: string, nowMs = Date.now()) {
  if (!token || !secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [version, issuedAt, signature] = parts;
  if (version !== ADMIN_SESSION_VERSION || !issuedAt || !signature || !/^\d+$/.test(issuedAt)) {
    return false;
  }

  const issuedAtSeconds = Number(issuedAt);
  const nowSeconds = Math.floor(nowMs / 1000);

  if (!Number.isSafeInteger(issuedAtSeconds)) return false;
  if (issuedAtSeconds > nowSeconds + CLOCK_SKEW_SECONDS) return false;
  if (nowSeconds - issuedAtSeconds > ADMIN_SESSION_MAX_AGE_SECONDS) return false;

  return safeEqual(signature, signAdminSession(issuedAt, secret));
}

export function verifyAdminPassword(input: string, expectedPassword: string) {
  if (!input || !expectedPassword) return false;
  return safeEqual(input, expectedPassword);
}

function signAdminSession(issuedAt: string, secret: string) {
  return createHmac("sha256", secret).update(`${ADMIN_SESSION_VERSION}.${issuedAt}`).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}
