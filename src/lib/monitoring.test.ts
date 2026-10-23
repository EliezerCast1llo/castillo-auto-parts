import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeMonitoringEvent } from "./monitoring-event";
import { sendMonitoringEvent, sentryEndpoint } from "./monitoring";
import { logError, observeOperation } from "./logger";
import { reportClientError } from "./client-monitoring";

const dsn = `https://${"a".repeat(32)}@o123.ingest.us.sentry.io/456`;
const secret = "private@example.com token-secret signature-secret 4111111111111111";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("strict telemetry allowlist", () => {
  it("discards raw errors, nested PII, arbitrary context/outcome and non-UUID identifiers", async () => {
    const error = new Error(secret, { cause: { card: secret } });
    error.name = secret;
    const event = sanitizeMonitoringEvent("error", { context: secret, outcome: secret,
      correlationId: secret, userId: secret, orderId: secret, error, request: { headers: secret }, token: secret });
    expect(event).toEqual({ level: "error", context: "unknown", outcome: "failed", correlationId: expect.any(String), timestamp: expect.any(String) });
    expect(JSON.stringify(event)).not.toContain(secret);
    expect(event.correlationId).toMatch(/^[a-f0-9-]{36}$/);
    const output = vi.spyOn(console, "error").mockImplementation(() => {});
    await logError({ context: "checkout", error, customerEmail: secret, signature: secret }, error);
    expect(output.mock.calls.flat().join("")).not.toContain(secret);
  });
  it("does not send anything with monitoring disabled (server and browser)", async () => {
    vi.stubEnv("SENTRY_DSN", ""); vi.stubEnv("NEXT_PUBLIC_ERROR_MONITORING_ENABLED", "");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    vi.spyOn(console, "error").mockImplementation(() => {});
    await logError({ context: "checkout" }, new Error(secret));
    reportClientError("client_error");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("browser opt-in sends only a fixed code to same-origin relay without credentials or referrer", async () => {
    vi.stubEnv("NEXT_PUBLIC_ERROR_MONITORING_ENABLED", "true");
    const fetch = vi.fn().mockRejectedValue(new Error(secret)); vi.stubGlobal("fetch", fetch);
    reportClientError("client_rejection");
    expect(fetch).toHaveBeenCalledWith("/api/monitoring", expect.objectContaining({
      credentials: "omit", referrerPolicy: "no-referrer", body: '{"kind":"client_rejection"}',
    }));
    await Promise.resolve();
  });
  it("keeps correlation stable across asynchronous work and isolates concurrent operations", async () => {
    vi.stubEnv("SENTRY_DSN", "");
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { logInfo } = await import("./logger");
    await Promise.all(["checkout", "boxful_webhook"].map((op) => observeOperation(op as "checkout" | "boxful_webhook", async () => {
      await Promise.resolve(); await logInfo({ context: "unknown", outcome: "completed" });
    })));
    const events = output.mock.calls.map(([line]) => JSON.parse(line));
    for (const op of ["checkout", "boxful_webhook"]) {
      const group = events.filter((event) => event.context === op);
      expect(group).toHaveLength(2);
      expect(group[0].correlationId).toBe(group[1].correlationId);
    }
    expect(new Set(events.map((event) => event.correlationId)).size).toBe(2);
    await expect(observeOperation("boxful_label", async () => { throw new Error(secret); })).rejects.toThrow(secret);
    expect(JSON.parse(errors.mock.calls[0][0])).toMatchObject({ context: "boxful_label", outcome: "failed" });
    expect(errors.mock.calls.flat().join("")).not.toContain(secret);
  });
  it("sends only sanitized fields in a minimal Sentry envelope and contains transport failures", async () => {
    vi.stubEnv("SENTRY_DSN", dsn);
    const fetch = vi.fn().mockRejectedValue(new Error(secret)); vi.stubGlobal("fetch", fetch);
    const input = sanitizeMonitoringEvent("error", { context: "wompi_webhook", outcome: "failed" });
    await expect(sendMonitoringEvent({ ...input, error: secret } as typeof input)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledOnce();
    const [endpoint, options] = fetch.mock.calls[0];
    expect(endpoint).toContain("https://o123.ingest.us.sentry.io/api/456/envelope/");
    const lines = options.body.trim().split("\n").map(JSON.parse);
    expect(lines[2].tags.correlation_id).toBe(input.correlationId);
    expect(options.body).not.toContain(secret);
    expect(options.body).not.toContain("request");
    expect(options).toMatchObject({ redirect: "error", credentials: "omit" });
  });
  it.each(["", "http://localhost/1", `https://${"a".repeat(32)}@evil.test/1`, `${dsn}?secret=abc`, dsn.replace("/456", "/456/path"), dsn.replace("@", ":secret@")])("rejects invalid or arbitrary-host DSNs: %s", (value) => {
    expect(sentryEndpoint(value)).toBeNull();
  });
  it("bounds provider sends per process even when the caller loops", async () => {
    vi.stubEnv("SENTRY_DSN", dsn);
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 })); vi.stubGlobal("fetch", fetch);
    for (let i = 0; i < 30; i++) await sendMonitoringEvent(sanitizeMonitoringEvent("error", { context: "checkout" }));
    expect(fetch.mock.calls.length).toBeLessThanOrEqual(20);
  });
});
