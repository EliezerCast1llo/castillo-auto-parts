/**
 * Rate limiter async con backend Redis opcional (Upstash).
 *
 * Estrategia de selección de backend:
 * - Si UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN están configuradas
 *   → usa Redis. Persiste entre reinicios y escala en serverless multi-instancia.
 * - Si no → usa el rate limiter en memoria (createRateLimiter).
 *   Funciona correctamente en desarrollo local y deploys single-instance.
 *
 * La API es idéntica en ambos casos: check / registerFailure / reset, todos async.
 *
 * Uso:
 *   const limiter = createAdminLoginRateLimiter();
 *   const result = await limiter.check(key);
 *   if (!result.allowed) redirect(...)
 *
 * Configuración de Upstash (agregar en .env.local o variables de Vercel):
 *   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=AXxx...
 */

import { createRateLimiter, type RateLimitOptions, type RateLimitResult } from "./rate-limit";

export type AsyncRateLimiter = {
  check(key: string): Promise<RateLimitResult>;
  registerFailure(key: string): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
};

/**
 * Crea el rate limiter para el login admin.
 * 5 intentos fallidos → bloqueo de 15 minutos por IP.
 */
export function createAdminLoginRateLimiter(): AsyncRateLimiter {
  const options: RateLimitOptions = {
    lockoutMs: 15 * 60 * 1000,
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  };

  return createAsyncRateLimiter(options);
}

/**
 * Factory principal. Selecciona backend Redis o en memoria según entorno.
 */
export function createAsyncRateLimiter(options: RateLimitOptions): AsyncRateLimiter {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (redisUrl && redisToken) {
    return buildRedisRateLimiter(options, redisUrl, redisToken);
  }

  // Fallback: wrapper async sobre el limiter síncrono en memoria
  const limiter = createRateLimiter(options);
  return {
    async check(key) {
      return limiter.check(key);
    },
    async registerFailure(key) {
      return limiter.registerFailure(key);
    },
    async reset(key) {
      limiter.reset(key);
    },
  };
}

// ---------------------------------------------------------------------------
// Implementación Redis via Upstash REST API (fetch nativo, sin dependencias)
// ---------------------------------------------------------------------------

/**
 * Construye un rate limiter respaldado por Redis usando la REST API de Upstash.
 *
 * Claves Redis por bucket (key = "admin-login:{ip}"):
 *   {key}:count   → contador de intentos fallidos (INCR + EXPIRE)
 *   {key}:locked  → timestamp Unix en ms hasta el que está bloqueado (SET EX)
 *
 * Semántica idéntica al limiter en memoria: solo cuenta fallos, no todas las
 * solicitudes. El reset al login exitoso elimina ambas claves.
 */
function buildRedisRateLimiter(
  options: RateLimitOptions,
  redisUrl: string,
  redisToken: string,
): AsyncRateLimiter {
  const windowSeconds = Math.ceil(options.windowMs / 1000);
  const lockoutSeconds = Math.ceil(options.lockoutMs / 1000);

  async function redisCommand<T>(command: unknown[]): Promise<T> {
    const response = await fetch(redisUrl, {
      body: JSON.stringify(command),
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Redis command failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as { result: T };
    return json.result;
  }

  async function pipeline(commands: unknown[][]): Promise<unknown[]> {
    const response = await fetch(`${redisUrl}/pipeline`, {
      body: JSON.stringify(commands),
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Redis pipeline failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as { result: unknown }[];
    return json.map((item) => item.result);
  }

  async function getLockoutMs(key: string, nowMs: number): Promise<number | null> {
    const value = await redisCommand<string | null>(["GET", `${key}:locked`]);
    if (!value) return null;
    const lockedUntil = Number(value);
    return lockedUntil > nowMs ? lockedUntil : null;
  }

  return {
    async check(key) {
      const nowMs = Date.now();

      try {
        const [lockedValue, countValue] = await pipeline([
          ["GET", `${key}:locked`],
          ["GET", `${key}:count`],
        ]);

        const lockedStr = lockedValue as string | null;
        if (lockedStr) {
          const lockedUntil = Number(lockedStr);
          if (lockedUntil > nowMs) {
            return {
              allowed: false,
              retryAfterSeconds: Math.max(Math.ceil((lockedUntil - nowMs) / 1000), 1),
            };
          }
        }

        const attempts = Number(countValue ?? 0);
        return {
          allowed: true,
          remainingAttempts: Math.max(options.maxAttempts - attempts, 0),
        };
      } catch (error) {
        // Si Redis no está disponible, permitir el intento (fail open en check,
        // fail seguro en registerFailure donde el log de error es suficiente).
        console.error("[rate-limit-redis] check failed, failing open:", error);
        return { allowed: true, remainingAttempts: options.maxAttempts };
      }
    },

    async registerFailure(key) {
      const nowMs = Date.now();

      try {
        // Verificar si ya está bloqueado antes de incrementar
        const lockedUntil = await getLockoutMs(key, nowMs);
        if (lockedUntil !== null) {
          return {
            allowed: false,
            retryAfterSeconds: Math.max(Math.ceil((lockedUntil - nowMs) / 1000), 1),
          };
        }

        // Incrementar contador y obtener valor actual
        const attempts = await redisCommand<number>(["INCR", `${key}:count`]);

        // Primer intento en esta ventana: establecer TTL de la ventana
        if (attempts === 1) {
          await redisCommand(["EXPIRE", `${key}:count`, String(windowSeconds)]);
        }

        if (attempts >= options.maxAttempts) {
          const lockUntilMs = nowMs + options.lockoutMs;
          await redisCommand([
            "SET",
            `${key}:locked`,
            String(lockUntilMs),
            "EX",
            String(lockoutSeconds),
          ]);
          return {
            allowed: false,
            retryAfterSeconds: lockoutSeconds,
          };
        }

        return {
          allowed: true,
          remainingAttempts: options.maxAttempts - attempts,
        };
      } catch (error) {
        // Si Redis falla durante un intento fallido, bloqueamos conservadoramente.
        console.error("[rate-limit-redis] registerFailure failed, failing closed:", error);
        return { allowed: false, retryAfterSeconds: 60 };
      }
    },

    async reset(key) {
      try {
        await redisCommand(["DEL", `${key}:count`, `${key}:locked`]);
      } catch (error) {
        console.error("[rate-limit-redis] reset failed:", error);
      }
    },
  };
}
