/**
 * admin-session.ts
 *
 * Creación y verificación del token de sesión admin (formato v2).
 *
 * Formato: `v2.{issuedAt}.{userId}.{role}.{displayNameB64}.{signature}`
 *   - issuedAt:      Unix timestamp en segundos (dígitos)
 *   - userId:        cuid del usuario (sin puntos)
 *   - role:          UserRole enum value (sin puntos)
 *   - displayNameB64: nombre o email del usuario en base64url (sin puntos)
 *   - signature:     HMAC-SHA256 del mensaje completo en base64url
 *
 * El mensaje firmado es la concatenación de los primeros 5 segmentos separados por `.`.
 * base64url no usa `.`, por lo que el split en 6 partes es siempre seguro.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@prisma/client";

export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

const VERSION = "v2";
const CLOCK_SKEW_SECONDS = 60;

export type AdminSessionPayload = {
  userId: string;
  role: UserRole;
  displayName: string;
  issuedAt: number;
};

// ---------------------------------------------------------------------------
// Creación
// ---------------------------------------------------------------------------

export function createAdminSessionToken(
  secret: string,
  userId: string,
  role: UserRole,
  displayName: string,
  nowMs = Date.now(),
): string {
  const issuedAt = Math.floor(nowMs / 1000).toString();
  const displayNameB64 = Buffer.from(displayName).toString("base64url");
  const message = `${VERSION}.${issuedAt}.${userId}.${role}.${displayNameB64}`;
  const signature = createHmac("sha256", secret).update(message).digest("base64url");
  return `${message}.${signature}`;
}

// ---------------------------------------------------------------------------
// Verificación
// ---------------------------------------------------------------------------

export function verifyAdminSessionToken(
  token: string | undefined,
  secret: string,
  nowMs = Date.now(),
): AdminSessionPayload | null {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 6) return null;

  const [version, issuedAtStr, userId, role, displayNameB64, signature] = parts;

  if (
    version !== VERSION ||
    !issuedAtStr ||
    !userId ||
    !role ||
    !displayNameB64 ||
    !signature ||
    !/^\d+$/.test(issuedAtStr)
  ) {
    return null;
  }

  const issuedAt = Number(issuedAtStr);
  if (!Number.isSafeInteger(issuedAt)) return null;

  const nowSeconds = Math.floor(nowMs / 1000);
  if (issuedAt > nowSeconds + CLOCK_SKEW_SECONDS) return null;
  if (nowSeconds - issuedAt > ADMIN_SESSION_MAX_AGE_SECONDS) return null;

  // Verificar firma con comparación de tiempo constante
  const message = `${VERSION}.${issuedAtStr}.${userId}.${role}.${displayNameB64}`;
  const expectedSig = createHmac("sha256", secret).update(message).digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  const displayName = Buffer.from(displayNameB64, "base64url").toString("utf8");

  return {
    userId,
    role: role as UserRole,
    displayName,
    issuedAt,
  };
}
