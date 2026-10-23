import { NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/content-security-policy";

/** Only compiled in SITE_MODE=landing. Store middleware and its auth imports are absent. */
export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const csp = buildContentSecurityPolicy({ nonce, environment: { NODE_ENV: process.env.NODE_ENV } });
  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", csp);
  headers.set("x-nonce", nonce);
  const path = request.nextUrl.pathname;
  const readable = request.method === "GET" || request.method === "HEAD";
  const allowed = path === "/" || path.startsWith("/_next/static/") || path === "/icon.svg";
  const response = !readable || !allowed
    ? new NextResponse(null, { status: 404 })
    : NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}
export const config = { matcher: ["/:path*"] };
