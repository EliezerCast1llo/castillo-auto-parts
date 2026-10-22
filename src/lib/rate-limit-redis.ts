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
 *
 * En producción, UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN son
 * obligatorios por defecto. El motivo es el modelo serverless: en Vercel cada
 * request puede caer en una instancia distinta, así que un contador en memoria
 * no limita nada y daría una falsa sensación de protección.
 *
 * Dos escapes explícitos, ambos con nombre honesto:
 *
 * - E2E_ISOLATED_DATABASE=true: el runner E2E, que necesita un limiter
 *   hermético aunque el build use NODE_ENV=production.
 * - ALLOW_IN_MEMORY_RATE_LIMIT=true: despliegues de un solo proceso de larga
 *   vida (un contenedor en Railway, Fly o similar). Ahí el contador en memoria
 *   sí limita de verdad, porque todas las peticiones pasan por el mismo
 *   proceso. No usar con más de una instancia: cada una llevaría su cuenta.
 */
export function createAsyncRateLimiter(options: RateLimitOptions): AsyncRateLimiter {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const isIsolatedE2E = process.env.E2E_ISOLATED_DATABASE === "true";
  const allowsInMemory = process.env.ALLOW_IN_MEMORY_RATE_LIMIT === "true";

  if (
    process.env.NODE_ENV === "production" &&
    !isIsolatedE2E &&
    !allowsInMemory &&
    (!redisUrl || !redisToken)
  ) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN son obligatorios en producción. " +
        "Crea una base de datos en upstash.com y añade las variables. " +
        "En un despliegue de un solo proceso puedes usar ALLOW_IN_MEMORY_RATE_LIMIT=true.",
    );
  }

  if (redisUrl && redisToken) {
    return buildRedisRateLimiter(options, redisUrl, redisToken);
  }

  // Fallback en memoria — solo dev/test
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

/** 10 intentos fallidos → bloqueo 15 min por IP. */
export function createCustomerLoginRateLimiter(): AsyncRateLimiter {
  return createAsyncRateLimiter({
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 15 * 60 * 1000,
  });
}

/** 5 registros → bloqueo 1 hora por IP. */
export function createRegisterRateLimiter(): AsyncRateLimiter {
  return createAsyncRateLimiter({
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
    lockoutMs: 60 * 60 * 1000,
  });
}

/** 5 solicitudes → bloqueo 1 hora (aplica a clave IP y clave email). */
export function createForgotPasswordRateLimiter(): AsyncRateLimiter {
  return createAsyncRateLimiter({
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
    lockoutMs: 60 * 60 * 1000,
  });
}

/** 5 intentos → bloqueo 15 min por IP. */
export function createResetPasswordRateLimiter(): AsyncRateLimiter {
  return createAsyncRateLimiter({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 15 * 60 * 1000,
  });
}

/** 60 búsquedas → bloqueo 1 min por IP. */
export function createSearchRateLimiter(): AsyncRateLimiter {
  return createAsyncRateLimiter({
    maxAttempts: 60,
    windowMs: 60 * 1000,
    lockoutMs: 60 * 1000,
  });
}

/** Uploads/deletes de imágenes admin: 30 solicitudes/min por IP. */
export function createAdminImageRateLimiter(): AsyncRateLimiter {
  return createAsyncRateLimiter({
    maxAttempts: 30,
    windowMs: 60 * 1000,
    lockoutMs: 60 * 1000,
  });
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

  // Fallback en memoria para cuando Redis falla en caliente. Es por-proceso (no
  // coordina entre instancias) pero limita de verdad, a diferencia de un fail-open
  // que deja pasar todo. En Railway single-instance protege por completo.
  const memoryFallback = createRateLimiter(options);

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
        // Redis caído: delegar al limiter en memoria en vez de dejar pasar todo.
        console.error("[rate-limit-redis] check failed, falling back to in-memory:", error);
        return memoryFallback.check(key);
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
        // Redis caído: contar el fallo en el limiter en memoria. Es por-proceso
        // (en multi-instancia el límite se multiplica por instancia) pero se
        // prefiere a un fail-closed que bloquearía TODO login ante cualquier
        // parpadeo de Redis (auto-DoS). En el deploy single-instance de Railway el
        // conteo en memoria es efectivo al 100%. El Map está acotado (MAX_BUCKETS).
        console.error("[rate-limit-redis] registerFailure failed, falling back to in-memory:", error);
        return memoryFallback.registerFailure(key);
      }
    },

    async reset(key) {
      memoryFallback.reset(key);
      try {
        await redisCommand(["DEL", `${key}:count`, `${key}:locked`]);
      } catch (error) {
        console.error("[rate-limit-redis] reset failed:", error);
      }
    },
  };
}
