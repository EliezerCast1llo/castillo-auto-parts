/**
 * Next.js Edge Middleware — CSP, ruteo de idiomas y protección de /admin/**
 *
 * Corre en Edge Runtime (sin Node.js APIs). Usa Web Crypto API para
 * verificar el HMAC-SHA256 del token de sesión admin v2.
 *
 * Token v2: `v2.{issuedAt}.{userId}.{role}.{displayNameB64}.{signature}`
 *
 * Orden de trabajo:
 *   1. Un nonce y una CSP por request, inyectados en los headers de la request.
 *   2. `/admin/**` se salta el ruteo de idiomas y pasa por la verificación de
 *      sesión y de rol.
 *   3. Las URLs viejas sin prefijo redirigen permanentemente a su equivalente
 *      en español.
 *   4. El resto lo resuelve next-intl, cuya respuesta se re-emite para no
 *      perder los headers forwardeados.
 *
 * La verificación Node.js completa ocurre en cada page/action via
 * `requireAdminRole()` (defensa en profundidad).
 */

import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/content-security-policy";
import { isBypassedPath, resolveLegacyRedirect } from "@/lib/i18n/legacy-redirects";
import {
  isRedirectResponse,
  markAsLocaleNegotiated,
  reissueIntlResponse,
} from "@/lib/i18n/middleware-composition";
import { routing } from "@/lib/i18n/routing";

/** Se construye una sola vez por instancia del runtime. */
const handleI18nRouting = createIntlMiddleware(routing);

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
  const nonce = createNonce();
  const csp = buildContentSecurityPolicy({ nonce });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // 1. El panel admin no lleva prefijo de idioma.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return withCspHeaders(await handleAdmin(request, requestHeaders), csp, nonce);
  }

  // 2. Endpoints y assets: ni idioma ni auth.
  if (isBypassedPath(pathname)) {
    return withCspHeaders(NextResponse.next({ request: { headers: requestHeaders } }), csp, nonce);
  }

  // 3. URLs viejas sin prefijo → permanente al equivalente en español.
  const legacyTarget = resolveLegacyRedirect(request.nextUrl);
  if (legacyTarget) {
    return withCspHeaders(NextResponse.redirect(legacyTarget, 308), csp, nonce);
  }

  // 4. Ruteo de idiomas.
  const intlResponse = handleI18nRouting(request);

  // Un redirect no renderiza HTML: no hace falta forwardear nada. Sí hace falta
  // declarar que el destino depende del idioma negociado.
  if (isRedirectResponse(intlResponse)) {
    return withCspHeaders(markAsLocaleNegotiated(intlResponse), csp, nonce);
  }

  return withCspHeaders(reissueIntlResponse(intlResponse, request, requestHeaders), csp, nonce);
}

/**
 * Verificación de sesión y rol del panel admin. Es la lógica que ya existía,
 * extraída para que el flujo principal se lea de corrido.
 */
async function handleAdmin(request: NextRequest, requestHeaders: Headers) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
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

  return NextResponse.next({ request: { headers: requestHeaders } });
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

function withCspHeaders(response: NextResponse, csp: string, nonce: string) {
  // Por defecto report-only (no rompe nada). Poner CSP_ENFORCE=true para emitir
  // el header que bloquea de verdad, una vez validado que no hay violaciones
  // legítimas en los reportes.
  const headerName =
    process.env.CSP_ENFORCE === "true"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";
  response.headers.set(headerName, csp);
  response.headers.set("x-nonce", nonce);
  return response;
}

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return uint8ArrayToBase64Url(bytes);
}

export const config = {
  matcher: [
    // `/` debe seguir matcheando: es donde se negocia el idioma.
    // `/admin` también: es donde se verifica la sesión.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|icon|apple-icon|manifest.webmanifest|\\.well-known|.*\\.(?:avif|css|gif|ico|jpg|jpeg|js|map|png|svg|webp)$).*)",
  ],
};
