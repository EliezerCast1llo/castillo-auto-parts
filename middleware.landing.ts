import { NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/content-security-policy";

/** Only compiled in SITE_MODE=landing. Store middleware and its auth imports are absent. */
export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const csp = buildContentSecurityPolicy({ nonce, environment: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_GOOGLE_ADS_ID: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  } });
  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", csp);
  headers.set("x-nonce", nonce);
  const path = request.nextUrl.pathname;
  const readable = request.method === "GET" || request.method === "HEAD";
  // Lista blanca: lo que no está acá devuelve 404 sin tocar ningún servicio.
  // `/en` es la landing en inglés; es una URL propia y no una cookie porque un
  // buscador tiene que poder indexarla aparte, y esta página no emite cookies.
  const allowed = path === "/" || path === "/en" || path.startsWith("/_next/static/")
    || path === "/icon.svg" || path === "/robots.txt" || path === "/sitemap.xml"
    || path === "/og.png";
  const response = !readable || !allowed
    ? new NextResponse(null, { status: 404 })
    : NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}
export const config = { matcher: ["/:path*"] };
