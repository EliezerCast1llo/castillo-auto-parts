/**
 * Next.js Edge Middleware — protección de rutas /admin/**
 *
 * Corre en Edge Runtime (sin Node.js APIs). Usa Web Crypto API para
 * verificar el HMAC-SHA256 del token de sesión admin v2.
 *
 * Token v2: `v2.{issuedAt}.{userId}.{role}.{displayNameB64}.{signature}`
 *
 * Dos niveles de protección:
 *   1. ¿Está autenticado? → si no, redirige al login.
 *   2. ¿Tiene el rol correcto para esta ruta? → si no, redirige a su home.
 *
 * La verificación Node.js completa ocurre en cada page/action via
 * `requireAdminRole()` (defensa en profundidad).
 */

import { type NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "castillo_admin_session";
const ADMIN_SESSION_VERSION = "v2";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const CLOCK_SKEW_SECONDS = 60;

// ---------------------------------------------------------------------------
// Permisos por ruta (prefijo más específico tiene prioridad)
// ---------------------------------------------------------------------------

const ROUTE_ROLES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin/users", roles: ["ADMIN"] },
  { prefix: "/admin/settings", roles: ["ADMIN"] },
  { prefix: "/admin/audit", roles: ["ADMIN"] },
  { prefix: "/admin/products", roles: ["ADMIN", "MARKETING"] },
  { prefix: "/admin/stock-alerts", roles: ["ADMIN", "SUPPORT", "WAREHOUSE"] },
  { prefix: "/admin/orders", roles: ["ADMIN", "SALES", "WAREHOUSE", "SUPPORT", "ACCOUNTING"] },
  // Fallback: cualquier ruta /admin/* requiere un rol no-CUSTOMER
  {
    prefix: "/admin",
    roles: ["ADMIN", "SALES", "WAREHOUSE", "SUPPORT", "ACCOUNTING", "MARKETING"],
  },
];

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin/orders",
  SALES: "/admin/orders",
  WAREHOUSE: "/admin/orders",
  SUPPORT: "/admin/orders",
  ACCOUNTING: "/admin/orders",
  MARKETING: "/admin/products",
};

// ---------------------------------------------------------------------------
// Middleware principal
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.ADMIN_ACCESS_SECRET?.trim() ?? "";

  const payload = secret ? await verifyAdminSessionTokenEdge(token, secret) : null;

  if (!payload) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", getSafeNextPath(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Verificar permisos de rol para la ruta actual
  const allowed = isRoleAllowedForPath(payload.role, pathname);
  if (!allowed) {
    const homeUrl = new URL(ROLE_HOME[payload.role] ?? "/admin/orders", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

function isRoleAllowedForPath(role: string, pathname: string): boolean {
  // Iterar en orden (prefijos más específicos primero)
  for (const entry of ROUTE_ROLES) {
    if (pathname.startsWith(entry.prefix)) {
      return entry.roles.includes(role);
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Verificación del token v2 con Web Crypto API (Edge Runtime)
// ---------------------------------------------------------------------------

type EdgePayload = { userId: string; role: string };

async function verifyAdminSessionTokenEdge(
  token: string | undefined,
  secret: string,
  nowMs = Date.now(),
): Promise<EdgePayload | null> {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 6) return null;

  const [version, issuedAtStr, userId, role, displayNameB64, signature] = parts;

  if (
    version !== ADMIN_SESSION_VERSION ||
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

  const message = `${ADMIN_SESSION_VERSION}.${issuedAtStr}.${userId}.${role}.${displayNameB64}`;
  const valid = await verifyHmacSha256Base64Url(message, secret, signature);
  if (!valid) return null;

  return { userId, role };
}

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

function safeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getSafeNextPath(pathname: string): string {
  if (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/login")) {
    return pathname;
  }
  return "/admin/orders";
}

export const config = {
  matcher: ["/admin/:path*"],
};
