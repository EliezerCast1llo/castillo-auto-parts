/**
 * Next.js Edge Middleware — protección de rutas /admin/**
 *
 * Corre en Edge Runtime (sin Node.js APIs). Usa Web Crypto API para
 * verificar el HMAC-SHA256 del token de sesión admin, replicando la
 * misma lógica que `verifyAdminSessionToken` en src/lib/admin-session.ts.
 *
 * La verificación aquí es la primera línea de defensa (UX rápida).
 * La verificación criptográfica completa en Node.js ocurre en cada
 * page/action a través de `requireAdminAccess()` (defensa en profundidad).
 */

import { type NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "castillo_admin_session";
const ADMIN_SESSION_VERSION = "v1";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas
const CLOCK_SKEW_SECONDS = 60;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acceso libre a la página de login y sus sub-rutas
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.ADMIN_ACCESS_SECRET?.trim() ?? "";

  // Si no hay secreto configurado, redirigir siempre al login
  const authenticated = secret
    ? await verifyAdminSessionTokenEdge(token, secret)
    : false;

  if (!authenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", getSafeNextPath(pathname));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Verifica el token de sesión admin usando Web Crypto API.
 * Replica la lógica de verifyAdminSessionToken en admin-session.ts.
 */
async function verifyAdminSessionTokenEdge(
  token: string | undefined,
  secret: string,
  nowMs = Date.now(),
): Promise<boolean> {
  if (!token || !secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [version, issuedAt, signature] = parts;

  if (
    version !== ADMIN_SESSION_VERSION ||
    !issuedAt ||
    !signature ||
    !/^\d+$/.test(issuedAt)
  ) {
    return false;
  }

  const issuedAtSeconds = Number(issuedAt);
  const nowSeconds = Math.floor(nowMs / 1000);

  if (!Number.isSafeInteger(issuedAtSeconds)) return false;
  if (issuedAtSeconds > nowSeconds + CLOCK_SKEW_SECONDS) return false;
  if (nowSeconds - issuedAtSeconds > ADMIN_SESSION_MAX_AGE_SECONDS) return false;

  // Verificación HMAC completa con Web Crypto API
  const message = `${ADMIN_SESSION_VERSION}.${issuedAt}`;
  return verifyHmacSha256Base64Url(message, secret, signature);
}

/**
 * Verifica una firma HMAC-SHA256 en base64url usando Web Crypto API.
 * Usa comparación de tiempo constante para prevenir timing attacks.
 */
async function verifyHmacSha256Base64Url(
  message: string,
  key: string,
  expectedSignature: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(key),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(message),
    );

    const actualSignature = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));

    return safeStringEqual(actualSignature, expectedSignature);
  } catch {
    return false;
  }
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Comparación de tiempo constante para strings (previene timing attacks).
 * No es perfectamente constante en JS pero es suficiente para este contexto
 * ya que la verificación Node.js con timingSafeEqual es la capa de seguridad real.
 */
function safeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Solo permite paths dentro de /admin/** como destino post-login.
 * Previene open redirects.
 */
function getSafeNextPath(pathname: string): string {
  if (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/login")) {
    return pathname;
  }
  return "/admin/orders";
}

export const config = {
  matcher: ["/admin/:path*"],
};
