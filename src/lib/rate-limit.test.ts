import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("rate limiter", () => {
  it("allows attempts until the limit is reached", () => {
    const limiter = createRateLimiter({
      lockoutMs: 60_000,
      maxAttempts: 3,
      windowMs: 60_000,
    });

    expect(limiter.check("admin", 1_000)).toMatchObject({
      allowed: true,
      remainingAttempts: 3,
    });
    expect(limiter.registerFailure("admin", 1_000)).toMatchObject({
      allowed: true,
      remainingAttempts: 2,
    });
    expect(limiter.registerFailure("admin", 2_000)).toMatchObject({
      allowed: true,
      remainingAttempts: 1,
    });
    expect(limiter.registerFailure("admin", 3_000)).toMatchObject({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("resets after a successful login", () => {
    const limiter = createRateLimiter({
      lockoutMs: 60_000,
      maxAttempts: 2,
      windowMs: 60_000,
    });

    limiter.registerFailure("admin", 1_000);
    limiter.reset("admin");

    expect(limiter.check("admin", 2_000)).toMatchObject({
      allowed: true,
      remainingAttempts: 2,
    });
  });

  it("acota la memoria: sigue funcional tras insertar muchas más keys que la cota", () => {
    const limiter = createRateLimiter({
      lockoutMs: 60_000,
      maxAttempts: 5,
      windowMs: 60_000,
    });

    // Simula un flood con IP única por request (keys distintas). Supera MAX_BUCKETS
    // (10_000). La evicción no debe romper el limiter ni lanzar.
    for (let i = 0; i < 12_000; i++) {
      limiter.registerFailure(`ip-${i}`, 1_000);
    }

    // Una key nueva sigue permitida y contando bien.
    expect(limiter.check("ip-nueva", 1_000)).toMatchObject({ allowed: true });
  });

  it("desaloja buckets expirados cuando se llena la cota", () => {
    const limiter = createRateLimiter({
      lockoutMs: 1_000,
      maxAttempts: 5,
      windowMs: 1_000,
    });

    // Llena la cota con buckets que expiran en t=2_000.
    for (let i = 0; i < 10_000; i++) {
      limiter.registerFailure(`old-${i}`, 1_000);
    }

    // Mucho después: los viejos están expirados; el nuevo insert los poda sin drama.
    expect(limiter.check("fresh", 1_000_000)).toMatchObject({ allowed: true });
  });
});
