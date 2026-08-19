/**
 * Extrae la IP del cliente para rate limiting, priorizando lo menos spoofeable.
 *
 * x-forwarded-for es una cadena "cliente, proxy1, proxy2": el valor de la
 * IZQUIERDA lo puede fijar el propio cliente antes de llegar al proxy, así que NO
 * es de fiar. El proxy confiable APPENDEA a la DERECHA la IP que realmente observó,
 * así que el último valor de x-forwarded-for es el más confiable.
 *
 * Orden de preferencia:
 *   1) ÚLTIMO valor de x-forwarded-for (el hop que el proxy realmente vio),
 *   2) x-real-ip como respaldo. Se pone después a propósito: solo es de fiar si la
 *      plataforma lo sobrescribe, y eso no se verifica acá; el hop derecho de XFF
 *      sí lo appendea el proxy. Si algún día se confirma que la plataforma reescribe
 *      x-real-ip, puede subirse de prioridad.
 *   3) "local" en desarrollo sin proxy.
 *
 * Nota: asume un único hop de proxy confiable (caso Railway/Vercel). Con varios
 * hops el fix correcto es tomar el valor a N-desde-la-derecha según la topología.
 */
export function getClientIp(headers: Headers | null | undefined): string {
  const forwardedFor = headers?.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const rightmost = parts[parts.length - 1];
    if (rightmost) return rightmost;
  }

  const realIp = headers?.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "local";
}
