import { afterEach, describe, expect, it, vi } from "vitest";
import { isIsolatedE2EEnvironment, validateProductionEnvironment } from "./production-environment";
import { register } from "../instrumentation";

const valid = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://localhost/fixture",
  DIRECT_DATABASE_URL: "postgresql://localhost/fixture",
  NEXTAUTH_SECRET: "fixture-customer-secret-with-more-than-32-characters",
  ADMIN_ACCESS_SECRET: "fixture-admin-secret-with-more-than-32-characters",
  GUEST_CART_SECRET: "fixture-cart-secret-with-more-than-32-characters",
  RESERVATION_CRON_SECRET: "fixture-cron-secret-with-more-than-32-characters",
  NEXT_PUBLIC_SITE_URL: "https://shop.example.com",
  NEXTAUTH_URL: "https://shop.example.com",
  PAYMENT_PROVIDER: "wompi",
  WOMPI_APP_ID: "fixture-app",
  WOMPI_API_SECRET: "fixture-api-secret",
  WOMPI_ENVIRONMENT: "production",
  WOMPI_WEBHOOK_URL: "https://shop.example.com/api/webhooks/wompi",
  EMAIL_PROVIDER: "resend",
  EMAIL_FROM: "Store <orders@example.com>",
  RESEND_API_KEY: "fixture-not-a-real-api-key",
  UPSTASH_REDIS_REST_URL: "https://fixture.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "fixture-not-a-real-token",
};

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("production startup configuration", () => {
  it("accepts a complete production configuration and the Auth.js alias", () => {
    expect(() => validateProductionEnvironment(valid)).not.toThrow();
    expect(() => validateProductionEnvironment({ ...valid, NEXTAUTH_SECRET: undefined, AUTH_SECRET: valid.NEXTAUTH_SECRET })).not.toThrow();
  });

  it.each(Object.keys(valid).filter((key) => key !== "NODE_ENV"))(
    "names a missing critical variable: %s",
    (key) => {
      expect(() => validateProductionEnvironment({ ...valid, [key]: "" })).toThrow(key);
    },
  );

  it("collects failures without echoing values, credentials or URLs", () => {
    let message = "";
    try {
      validateProductionEnvironment({
        ...valid,
        DATABASE_URL: "mysql://sensitive-user:sensitive-password@private-host/db",
        NEXTAUTH_SECRET: "private-short-value",
        PAYMENT_PROVIDER: "private-provider-value",
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("DATABASE_URL");
    expect(message).toContain("NEXTAUTH_SECRET");
    expect(message).toContain("PAYMENT_PROVIDER");
    for (const value of ["sensitive-user", "sensitive-password", "private-host", "private-short-value", "private-provider-value"]) {
      expect(message).not.toContain(value);
    }
  });

  it("rejects mock payments, console mail, sandbox payments and placeholder secrets", () => {
    expect(() => validateProductionEnvironment({ ...valid, PAYMENT_PROVIDER: "mock" })).toThrow("PAYMENT_PROVIDER");
    expect(() => validateProductionEnvironment({ ...valid, EMAIL_PROVIDER: "console" })).toThrow("EMAIL_PROVIDER");
    expect(() => validateProductionEnvironment({ ...valid, WOMPI_ENVIRONMENT: "sandbox" })).toThrow("WOMPI_ENVIRONMENT");
    expect(() => validateProductionEnvironment({ ...valid, RESERVATION_CRON_SECRET: "replace-with-a-long-placeholder-secret" })).toThrow("RESERVATION_CRON_SECRET");
    expect(() => validateProductionEnvironment({ ...valid, GUEST_CART_SECRET: valid.ADMIN_ACCESS_SECRET })).toThrow("GUEST_CART_SECRET");
  });

  it("permits an explicit single-process rate limiter and does not block development", () => {
    expect(() => validateProductionEnvironment({ ...valid, ALLOW_IN_MEMORY_RATE_LIMIT: "true", UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "" })).not.toThrow();
    expect(() => validateProductionEnvironment({ NODE_ENV: "development" })).not.toThrow();
  });

  it("allows test providers only with both test flags and a disposable schema", () => {
    const test = {
      ...valid,
      E2E_ISOLATED_DATABASE: "true",
      ALLOW_MOCK_PAYMENT_IN_E2E: "true",
      PAYMENT_PROVIDER: "mock",
      EMAIL_PROVIDER: "console",
      DATABASE_URL: "postgresql://localhost/fixture?schema=e2e_fixture",
      DIRECT_DATABASE_URL: "postgresql://localhost/fixture?schema=e2e_fixture",
    };
    expect(isIsolatedE2EEnvironment(test)).toBe(true);
    expect(() => validateProductionEnvironment(test)).not.toThrow();
    for (const change of [
      { ALLOW_MOCK_PAYMENT_IN_E2E: "" },
      { DATABASE_URL: valid.DATABASE_URL },
      { DIRECT_DATABASE_URL: valid.DIRECT_DATABASE_URL },
    ]) {
      expect(isIsolatedE2EEnvironment({ ...test, ...change })).toBe(false);
      expect(() => validateProductionEnvironment({ ...test, ...change })).toThrow("PAYMENT_PROVIDER");
    }
  });

  it("runs validation from the Node.js instrumentation startup hook", async () => {
    for (const [key, value] of Object.entries(valid)) vi.stubEnv(key, value);
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    await expect(register()).resolves.toBeUndefined();
    vi.stubEnv("DATABASE_URL", "");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("startup exit requested"); });
    await expect(register()).rejects.toThrow("startup exit requested");
    expect(exit).toHaveBeenCalledWith(1);
    expect(log.mock.calls[0][0]).toContain("DATABASE_URL");
  });
});
