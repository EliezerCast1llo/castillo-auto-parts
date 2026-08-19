import { NextResponse } from "next/server";
import type { AsyncRateLimiter } from "./rate-limit-redis";

/**
 * Aplica un rate limit por-solicitud en un Route Handler. registerFailure ya
 * verifica el bloqueo antes de incrementar en ambos backends, así que una sola
 * llamada implementa toda la semántica (contar esta solicitud + bloquear si se
 * pasó). Devuelve un 429 listo para retornar, o null si la solicitud pasa.
 */
export async function enforceRateLimit(
  limiter: AsyncRateLimiter,
  key: string,
  message: string,
): Promise<NextResponse | null> {
  const attempt = await limiter.registerFailure(key);
  if (!attempt.allowed) return tooManyRequests(attempt.retryAfterSeconds, message);

  return null;
}

function tooManyRequests(retryAfterSeconds: number, message: string) {
  return NextResponse.json(
    { error: message },
    {
      headers: { "Retry-After": String(retryAfterSeconds) },
      status: 429,
    },
  );
}
