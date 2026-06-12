import type { NextConfig } from "next";

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

export default nextConfig;
