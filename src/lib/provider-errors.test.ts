import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OperationalErrorCode } from "./operational-error";

const mocks = vi.hoisted(() => ({ resend: vi.fn(), r2: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.resend }; } }));
vi.mock("@aws-sdk/client-s3", async (original) => ({
  ...await original<typeof import("@aws-sdk/client-s3")>(),
  S3Client: class { send = mocks.r2; },
}));
const sensitive = "private@example.com token-secret account-secret card-4111111111111111";
const dsn = `https://${"b".repeat(32)}@o123.ingest.sentry.io/2`;

beforeEach(() => {
  vi.resetModules(); mocks.resend.mockReset(); mocks.r2.mockReset();
  vi.stubEnv("SENTRY_DSN", dsn);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

async function expectDiagnostic(work: () => unknown, code: OperationalErrorCode) {
  let caught: unknown;
  try { await work(); } catch (error) { caught = error; }
  expect(caught).toMatchObject({ code });
  const { logError } = await import("./logger");
  await logError({ context: "checkout", outcome: "failed", errorCode: sensitive }, caught);
  expect(JSON.parse(vi.mocked(console.error).mock.calls[0][0])).toMatchObject({ errorCode: code });
  const fetch = vi.mocked(globalThis.fetch);
  const [, options] = fetch.mock.calls.at(-1)!;
  const body = String(options?.body);
  expect(body).toContain(`"error_code":"${code}"`);
  expect(body).not.toContain(sensitive);
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(sensitive);
}

describe("fixed provider diagnostics without raw data", () => {
  it.each(["", "bad-environment"])("classifies Wompi configuration %j", async (environment) => {
    const { getWompiConfig } = await import("./payments/wompi-provider");
    await expectDiagnostic(() => getWompiConfig({ NODE_ENV: "test", WOMPI_ENVIRONMENT: environment }), environment ? "CONFIG_INVALID" : "CONFIG_MISSING");
  });
  it.each([401, 503, "network", "invalid-json"])("classifies Wompi failure %s", async (failure) => {
    const { createWompiPaymentProvider } = await import("./payments/wompi-provider");
    const fetch = vi.fn<typeof globalThis.fetch>();
    if (failure === "network") fetch.mockRejectedValue(new Error(sensitive));
    else fetch.mockResolvedValue(new Response(sensitive, { status: typeof failure === "number" ? failure : 200 }));
    const provider = createWompiPaymentProvider({ apiBaseUrl: "https://api.test", identityBaseUrl: "https://id.test",
      appId: "fixture", apiSecret: sensitive, environment: "sandbox", webhookSecret: sensitive, webhookUrl: "https://shop.test/webhook" }, fetch);
    await expectDiagnostic(() => provider.createPayment({ amountCents: 100, currency: "USD", customerEmail: sensitive,
      orderNumber: "CAP-1", redirectUrl: "https://shop.test/" }),
    failure === 503 || failure === "network" ? "PROVIDER_UNAVAILABLE" : "PROVIDER_REJECTED");
  });
  it.each(["missing", "rejected", "unavailable", "network"])("classifies Resend failure %s", async (failure) => {
    vi.stubEnv("RESEND_API_KEY", failure === "missing" ? "" : sensitive);
    if (failure === "network") mocks.resend.mockRejectedValue(new Error(sensitive));
    else mocks.resend.mockResolvedValue({ error: { statusCode: failure === "unavailable" ? 503 : 422, message: sensitive } });
    const { resendEmailProvider } = await import("./email/resend-provider");
    await expectDiagnostic(() => resendEmailProvider.sendEmail({ from: sensitive, to: sensitive, subject: sensitive, html: sensitive, text: sensitive }),
      failure === "missing" ? "CONFIG_MISSING" : failure === "rejected" ? "PROVIDER_REJECTED" : "PROVIDER_UNAVAILABLE");
  });
  it.each(["missing", "invalid", "rejected", "network"])("classifies R2 failure %s", async (failure) => {
    vi.stubEnv("CLOUDFLARE_R2_BUCKET_NAME", failure === "missing" ? "" : "fixture");
    vi.stubEnv("CLOUDFLARE_R2_ACCOUNT_ID", "fixture");
    vi.stubEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", sensitive);
    vi.stubEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", sensitive);
    vi.stubEnv("CLOUDFLARE_R2_PUBLIC_URL", failure === "invalid" ? sensitive : "https://images.test");
    mocks.r2.mockRejectedValue(Object.assign(new Error(sensitive), failure === "rejected" ? { $metadata: { httpStatusCode: 403 } } : {}));
    const r2 = await import("./r2");
    await expectDiagnostic(() => failure === "invalid" ? r2.getR2PublicUrl("fixture") : r2.uploadToR2("fixture", Buffer.alloc(12), "image/png"),
      failure === "missing" ? "CONFIG_MISSING" : failure === "invalid" ? "CONFIG_INVALID" : failure === "rejected" ? "PROVIDER_REJECTED" : "PROVIDER_UNAVAILABLE");
  });
  it.each(["missing", "invalid"])("classifies Upstash configuration %s", async (failure) => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("E2E_ISOLATED_DATABASE", ""); vi.stubEnv("ALLOW_IN_MEMORY_RATE_LIMIT", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", failure === "missing" ? "" : sensitive);
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", sensitive);
    const { createAsyncRateLimiter } = await import("./rate-limit-redis");
    await expectDiagnostic(() => createAsyncRateLimiter({ maxAttempts: 2, windowMs: 1000, lockoutMs: 1000 }),
      failure === "missing" ? "CONFIG_MISSING" : "CONFIG_INVALID");
  });
  it.each([401, 503, "network"])("logs sanitized Upstash fallback %s and still limits requests", async (failure) => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fixture.upstash.io"); vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", sensitive);
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (url) => {
      if (String(url).includes("sentry.io")) return new Response(null, { status: 200 });
      if (failure === "network") throw new Error(sensitive);
      return new Response(sensitive, { status: typeof failure === "number" ? failure : 503 });
    });
    vi.stubGlobal("fetch", fetch);
    const { createAsyncRateLimiter } = await import("./rate-limit-redis");
    const limiter = createAsyncRateLimiter({ maxAttempts: 1, windowMs: 1000, lockoutMs: 1000 });
    expect((await limiter.registerFailure(sensitive)).allowed).toBe(false);
    expect((await limiter.check(sensitive)).allowed).toBe(false);
    const code = failure === 401 ? "PROVIDER_REJECTED" : "PROVIDER_UNAVAILABLE";
    expect(JSON.parse(vi.mocked(console.warn).mock.calls[0][0])).toMatchObject({ errorCode: code });
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(sensitive);
    const envelopes = fetch.mock.calls.filter(([url]) => String(url).includes("sentry.io")).map(([, options]) => String(options?.body));
    expect(envelopes).toHaveLength(2);
    expect(envelopes.every((body) => body.includes(code) && !body.includes(sensitive))).toBe(true);
  });
  it("logs a fixed shipping code while preserving the empty-rates response", async () => {
    const { getShippingRates } = await import("./shipping");
    const request = { packages: [], totalWeightGrams: 100, destination: { addressLine1: sensitive, department: sensitive,
      city: sensitive, landmark: sensitive, latitude: 13.5, longitude: -88.5 } };
    expect(await getShippingRates(request, { async getRates() { throw new Error(sensitive); } })).toEqual([]);
    expect(JSON.parse(vi.mocked(console.warn).mock.calls[0][0])).toMatchObject({ errorCode: "SHIPPING_RATE_UNAVAILABLE" });
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(sensitive);
    expect(String(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body)).toContain('"error_code":"SHIPPING_RATE_UNAVAILABLE"');
  });
});
