import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const ORDER_ACCESS_TOKEN_BYTES = 32;

export function createOrderAccessToken() {
  return randomBytes(ORDER_ACCESS_TOKEN_BYTES).toString("base64url");
}

export function hashOrderAccessToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function verifyOrderAccessToken(
  token: string | undefined,
  expectedHash: string | null | undefined,
) {
  if (!token || !expectedHash) return false;

  const tokenHash = hashOrderAccessToken(token);
  const tokenHashBuffer = Buffer.from(tokenHash);
  const expectedHashBuffer = Buffer.from(expectedHash);

  if (tokenHashBuffer.length !== expectedHashBuffer.length) return false;

  return timingSafeEqual(tokenHashBuffer, expectedHashBuffer);
}

export function buildOrderAccessHref(orderNumber: string, accessToken: string) {
  const params = new URLSearchParams({ token: accessToken });
  return `/orders/${encodeURIComponent(orderNumber)}?${params.toString()}`;
}
