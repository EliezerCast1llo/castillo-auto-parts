import type { NextConfig } from "next";

/**
 * Extrae el hostname de R2_PUBLIC_URL para incluirlo en remotePatterns.
 * Necesario para que next/image pueda optimizar imágenes servidas desde R2.
 * Si la variable no está definida (p.ej. en CI), se omite el patrón R2.
 */
function getR2Hostname(): string | null {
  const raw = process.env.R2_PUBLIC_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const r2Hostname = getR2Hostname();

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
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
        protocol: "https",
      },
      // R2 public bucket — hostname se lee de R2_PUBLIC_URL para evitar hardcodear
      ...(r2Hostname
        ? [
            {
              hostname: r2Hostname,
              protocol: "https" as const,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
