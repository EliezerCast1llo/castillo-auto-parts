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

  const bucket = {
    attempts: 0,
    lockedUntil: 0,
    resetAt: nowMs + options.windowMs,
  };

  buckets.set(key, bucket);
  return bucket;
}

function deny(lockedUntil: number, nowMs: number): RateLimitResult {
  return {
    allowed: false,
    retryAfterSeconds: Math.max(Math.ceil((lockedUntil - nowMs) / 1000), 1),
  };
}
