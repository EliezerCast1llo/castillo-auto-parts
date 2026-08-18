export type RateLimitOptions = {
  lockoutMs: number;
  maxAttempts: number;
  windowMs: number;
};

type RateLimitBucket = {
  attempts: number;
  lockedUntil: number;
  resetAt: number;
};

// Cota dura del número de buckets vivos. Impide que, durante una caída de Redis
// (cuando este limiter en memoria recibe todo el tráfico) un atacante con
// x-forwarded-for único por request haga crecer el Map sin límite hasta OOM.
const MAX_BUCKETS = 10_000;

export type RateLimitResult =
  | {
      allowed: true;
      remainingAttempts: number;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
    };

export function createRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    check(key: string, nowMs = Date.now()): RateLimitResult {
      const bucket = getActiveBucket(buckets, key, options, nowMs);

      if (bucket.lockedUntil > nowMs) {
        return deny(bucket.lockedUntil, nowMs);
      }

      return {
        allowed: true,
        remainingAttempts: Math.max(options.maxAttempts - bucket.attempts, 0),
      };
    },

    registerFailure(key: string, nowMs = Date.now()): RateLimitResult {
      const bucket = getActiveBucket(buckets, key, options, nowMs);

      if (bucket.lockedUntil > nowMs) {
        return deny(bucket.lockedUntil, nowMs);
      }

      bucket.attempts += 1;

      if (bucket.attempts >= options.maxAttempts) {
        bucket.lockedUntil = nowMs + options.lockoutMs;
        return deny(bucket.lockedUntil, nowMs);
      }

      return {
        allowed: true,
        remainingAttempts: options.maxAttempts - bucket.attempts,
      };
    },

    reset(key: string) {
      buckets.delete(key);
    },
  };
}

function getActiveBucket(
  buckets: Map<string, RateLimitBucket>,
  key: string,
  options: RateLimitOptions,
  nowMs: number,
) {
  const existingBucket = buckets.get(key);

  if (existingBucket && existingBucket.resetAt > nowMs && existingBucket.lockedUntil <= nowMs) {
    return existingBucket;
  }

  if (existingBucket && existingBucket.lockedUntil > nowMs) {
    return existingBucket;
  }

  if (buckets.size >= MAX_BUCKETS) {
    evictBuckets(buckets, nowMs);
  }

  const bucket = {
    attempts: 0,
    lockedUntil: 0,
    resetAt: nowMs + options.windowMs,
  };

  buckets.set(key, bucket);
  return bucket;
}

// Poda para acotar memoria. Baja siempre hasta un target con holgura (la mitad de
// la cota) para no re-escanear en cada inserción posterior. Garantiza el límite
// duro: la memoria queda acotada aunque TODOS los buckets estén bloqueados.
function evictBuckets(buckets: Map<string, RateLimitBucket>, nowMs: number) {
  const target = Math.floor(MAX_BUCKETS / 2);

  // 1) Borra buckets totalmente expirados (ventana vencida y sin bloqueo activo).
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= nowMs && bucket.lockedUntil <= nowMs) {
      buckets.delete(key);
    }
  }

  if (buckets.size <= target) return;

  // 2) Desaloja los más antiguos SIN bloqueo activo (preferimos conservar lockouts
  //    reales; un flood de keys únicas no debe poder borrarlos).
  for (const [key, bucket] of buckets) {
    if (buckets.size <= target) break;
    if (bucket.lockedUntil > nowMs) continue;
    buckets.delete(key);
  }

  if (buckets.size <= target) return;

  // 3) Cota dura: si sigue por encima (p. ej. 50k IPs falsas todas bloqueadas),
  //    desaloja los más antiguos aunque estén bloqueados. Se sacrifica algún
  //    lockout para garantizar el techo de memoria; el atacante solo puede liberar
  //    su propio bloqueo manteniendo >target IPs distintas, y la memoria no crece.
  for (const key of buckets.keys()) {
    if (buckets.size <= target) break;
    buckets.delete(key);
  }
}

function deny(lockedUntil: number, nowMs: number): RateLimitResult {
  return {
    allowed: false,
    retryAfterSeconds: Math.max(Math.ceil((lockedUntil - nowMs) / 1000), 1),
  };
}
