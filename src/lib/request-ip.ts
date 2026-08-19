/**
 * Extrae la IP del cliente para rate limiting, priorizando lo menos spoofeable.
 *
 * x-forwarded-for es una cadena "cliente, proxy1, proxy2": el valor de la
 * IZQUIERDA lo puede fijar el propio cliente antes de llegar al proxy, así que NO
 * es de fiar. El proxy confiable (Railway/Vercel) APPENDEA a la derecha lo que
 * observó, y además setea x-real-ip con la IP real, sobrescribiendo lo que mande
 * el cliente. Por eso:
 *   1) se prefiere x-real-ip (lo pone la plataforma),
 *   2) si no, el ÚLTIMO valor de x-forwarded-for (el hop visto por el proxy),
 *   3) fallback "local" en desarrollo sin proxy.
 *
 * Nota: asume un único hop de proxy confiable (caso Railway/Vercel). Con varios
 * hops el fix correcto es tomar el valor a N-desde-la-derecha según la topología.
 */
export function getClientIp(headers: Headers | null | undefined): string {
  const realIp = headers?.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = headers?.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const rightmost = parts[parts.length - 1];
    if (rightmost) return rightmost;
  }

  return "local";
}
