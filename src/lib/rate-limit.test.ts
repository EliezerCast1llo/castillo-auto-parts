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
});
