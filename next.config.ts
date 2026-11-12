import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { sitePageExtensions } from "./src/lib/site-mode";
import { CANONICAL_SITE_ORIGIN } from "./src/lib/site";
import { landingSiteUrl } from "./src/lib/landing-site-url";

function getHostnameFromUrl(value: string | undefined) {
  if (!value) return null;

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

const r2PublicHostname = getHostnameFromUrl(process.env.CLOUDFLARE_R2_PUBLIC_URL);
const isProduction = process.env.NODE_ENV === "production";

// En producción solo se permiten imágenes del bucket R2.
// En desarrollo se añade Unsplash para las imágenes de semilla/prueba.
const imageRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  ...(!isProduction
    ? [
        {
          hostname: "images.unsplash.com",
          protocol: "https" as const,
        },
      ]
    : []),
  ...(r2PublicHostname
    ? [
        {
          hostname: r2PublicHostname,
          protocol: "https" as const,
        },
      ]
    : []),
];

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  pageExtensions: sitePageExtensions(),
  // Conservar el origen de los rewrites de next-intl. Next normaliza las IP
  // loopback a `localhost`; ligado a 127.0.0.1, el rewrite /es/ayuda → /es/help
  // se interpreta como externo, vuelve al proxy y redirige a /es/ayuda en bucle.
  skipProxyUrlNormalize: true,
  // Fija la raíz del workspace: evita que Turbopack infiera una raíz incorrecta
  // por lockfiles ajenos en directorios superiores.
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    // Turn on only after the campaign uses the new final URL. The fixed host
    // match keeps deployment/branch previews and the apex out of this rule.
    if (
      process.env.VERCEL_ENV !== "production" ||
      process.env.LEGACY_VERCEL_REDIRECT_ENABLED !== "true" ||
      landingSiteUrl() !== CANONICAL_SITE_ORIGIN
    ) return [];

    const has = [{ type: "host" as const, value: "castillo-auto-parts\\.vercel\\.app" }];
    // The optional catch-all compiles the root without its trailing slash.
    return [
      { source: "/", has, destination: `${CANONICAL_SITE_ORIGIN}/`, permanent: true },
      { source: "/:path+", has, destination: `${CANONICAL_SITE_ORIGIN}/:path+`, permanent: true },
    ];
  },
  async headers() {
    return [
      {
        headers: securityHeaders,
        source: "/(.*)",
      },
    ];
  },
  images: {
    remotePatterns: imageRemotePatterns,
    minimumCacheTTL: 86400,
    formats: ["image/avif", "image/webp"],
  },
};

/**
 * `createNextIntlPlugin` es un **default export**, no nombrado: la doc oficial
 * muestra `import {createNextIntlPlugin}` y está equivocada.
 */
const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

export default withNextIntl(nextConfig);
