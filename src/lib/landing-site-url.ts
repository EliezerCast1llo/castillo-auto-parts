/** Canonical landing origin; independent of store configuration and services. */
export function landingSiteUrl() {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://castillo-auto-parts.vercel.app").origin;
}
