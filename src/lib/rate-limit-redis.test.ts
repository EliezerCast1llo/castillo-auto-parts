import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createAsyncRateLimiter — validación de producción", () => {
  it("lanza si NODE_ENV=production y faltan variables Upstash", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { createAsyncRateLimiter } = await import("./rate-limit-redis");
    expect(() =>
      createAsyncRateLimiter({ maxAttempts: 5, windowMs: 60_000, lockoutMs: 60_000 }),
    ).toThrow(/UPSTASH_REDIS_REST_URL/);
  });

  it("no lanza en desarrollo sin Redis", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const { createAsyncRateLimiter } = await import("./rate-limit-redis");
    expect(() =>
      createAsyncRateLimiter({ maxAttempts: 5, windowMs: 60_000, lockoutMs: 60_000 }),
    ).not.toThrow();
  });

  it("no lanza en producción si Redis está configurado", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token-abc123");

    const { createAsyncRateLimiter } = await import("./rate-limit-redis");
    expect(() =>
      createAsyncRateLimiter({ maxAttempts: 5, windowMs: 60_000, lockoutMs: 60_000 }),
    ).not.toThrow();
  });
});

describe("factories de rate limit para auth de clientes", () => {
  it("createCustomerLoginRateLimiter devuelve un AsyncRateLimiter", async () => {
    const { createCustomerLoginRateLimiter } = await import("./rate-limit-redis");
    const limiter = createCustomerLoginRateLimiter();
    expect(limiter.check).toBeTypeOf("function");
    expect(limiter.registerFailure).toBeTypeOf("function");
    expect(limiter.reset).toBeTypeOf("function");
  });

  it("createRegisterRateLimiter devuelve un AsyncRateLimiter", async () => {
    const { createRegisterRateLimiter } = await import("./rate-limit-redis");
    const limiter = createRegisterRateLimiter();
    expect(limiter.check).toBeTypeOf("function");
  });

  it("createForgotPasswordRateLimiter devuelve un AsyncRateLimiter", async () => {
    const { createForgotPasswordRateLimiter } = await import("./rate-limit-redis");
    const limiter = createForgotPasswordRateLimiter();
    expect(limiter.check).toBeTypeOf("function");
  });

  it("createResetPasswordRateLimiter devuelve un AsyncRateLimiter", async () => {
    const { createResetPasswordRateLimiter } = await import("./rate-limit-redis");
    const limiter = createResetPasswordRateLimiter();
    expect(limiter.check).toBeTypeOf("function");
  });

  it("el limiter en memoria bloquea después de maxAttempts fallos", async () => {
    const { createCustomerLoginRateLimiter } = await import("./rate-limit-redis");
    const limiter = createCustomerLoginRateLimiter();

    // 10 fallos consecutivos
    for (let i = 0; i < 10; i++) {
      await limiter.registerFailure("test-key");
    }
    const result = await limiter.check("test-key");
    expect(result.allowed).toBe(false);
  });

  it("el limiter resetea después de un login exitoso", async () => {
    const { createCustomerLoginRateLimiter } = await import("./rate-limit-redis");
    const limiter = createCustomerLoginRateLimiter();

    await limiter.registerFailure("reset-key");
    await limiter.reset("reset-key");

    const result = await limiter.check("reset-key");
    expect(result.allowed).toBe(true);
  });
});
