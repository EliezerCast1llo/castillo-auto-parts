import { NextResponse } from "next/server";
import type { AsyncRateLimiter } from "./rate-limit-redis";

/**
 * Aplica un rate limit por-solicitud en un Route Handler. Igual que /api/search:
 * check() bloquea si ya se pasó el límite, y registerFailure() cuenta ESTA
 * solicitud contra la ventana. Devuelve un 429 listo para retornar, o null si
 * la solicitud pasa.
 */
export async function enforceRateLimit(
  limiter: AsyncRateLimiter,
  key: string,
  message: string,
): Promise<NextResponse | null> {
  const check = await limiter.check(key);
  if (!check.allowed) return tooManyRequests(check.retryAfterSeconds, message);

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
