import { landingSiteUrl } from "@/lib/landing-site-url";

// Separate handlers preserve the storefront's metadata routes and dependency isolation.
export const dynamic = "force-static";

export function GET() {
  return new Response(`User-Agent: *\nAllow: /\n\nSitemap: ${landingSiteUrl()}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
