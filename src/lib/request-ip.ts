/**
 * Extrae la IP del cliente de los headers de proxy. Detrás de un proxy/CDN
 * confiable (Railway, Vercel) x-forwarded-for lleva la IP real como primer valor.
 * Fallback "local" para desarrollo sin proxy.
 */
export function getClientIp(headers: Headers | null | undefined): string {
  const forwardedFor = headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers?.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "local";
}
