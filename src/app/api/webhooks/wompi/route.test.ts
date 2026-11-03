import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as payments from "@/lib/payments";
import { POST } from "./route";
import * as paymentEvents from "@/lib/payment-events";
import { OperationalError } from "@/lib/operational-error";

const originalEnvironment = { ...process.env };
const webhookSecret = "webhook-test-secret";

describe("Wompi webhook route", () => {
  beforeEach(() => {
    process.env.WOMPI_APP_ID = "test-app";
    process.env.WOMPI_API_SECRET = "api-test-secret";
    process.env.WOMPI_WEBHOOK_SECRET = webhookSecret;
    process.env.WOMPI_WEBHOOK_URL = "https://shop.test/api/webhooks/wompi";
    process.env.WOMPI_ENVIRONMENT = "sandbox";
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("logs an unexpected provider failure with the response correlation and no sensitive data", async () => {
    const sensitive = "private@example.com token-secret signature-secret 4111111111111111";
    process.env.SENTRY_DSN = "";
    const output = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(payments, "getPaymentProvider").mockImplementation(() => { throw new Error(sensitive, { cause: { token: sensitive } }); });
    const response = await POST(new Request("https://shop.test/api/webhooks/wompi", {
      method: "POST", headers: { authorization: sensitive, "x-correlation-id": sensitive }, body: sensitive,
    }));
    expect(response.status).toBe(503);
    const event = JSON.parse(output.mock.calls[0][0]);
    expect(event).toMatchObject({ context: "wompi_webhook", outcome: "failed", correlationId: response.headers.get("x-correlation-id") });
    expect(JSON.stringify(event)).not.toContain(sensitive);
    expect(event.correlationId).toMatch(/^[a-f0-9-]{36}$/);
  });

  it("returns 401 before parsing a webhook with an invalid signature", async () => {
    const response = await POST(
      new Request("https://shop.test/api/webhooks/wompi", {
        body: '{"Monto":12.99}',
        headers: { wompi_hash: "0".repeat(64) },
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: "invalid_signature",
    });
  });

  it("rejects a flood of invalid signatures without spending monitoring quota, then reports a signed failure", async () => {
    vi.stubEnv("SENTRY_DSN", `https://${"a".repeat(32)}@o123.ingest.sentry.io/1`);
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const info = vi.spyOn(console, "log").mockImplementation(() => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnings = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (let i = 0; i < 40; i++) {
      const response = await POST(new Request("https://shop.test/api/webhooks/wompi", {
        method: "POST", headers: { wompi_hash: "0".repeat(64) }, body: "private@example.com invalid body",
      }));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ ok: false, reason: "invalid_signature" });
    }
    expect(fetch).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();
    const rejectionLogs = info.mock.calls.map(([line]) => JSON.parse(line)).filter((event) => event.outcome === "invalid_signature");
    expect(rejectionLogs).toHaveLength(40);
    expect(rejectionLogs.every((event) => event.errorCode === "WEBHOOK_SIGNATURE_INVALID")).toBe(true);
    vi.spyOn(paymentEvents, "processPaymentWebhookEvent").mockRejectedValue(new OperationalError("PROVIDER_UNAVAILABLE", "private@example.com token-secret"));
    const body = '{"Monto":12.99}';
    const response = await POST(new Request("https://shop.test/api/webhooks/wompi", { method: "POST", body,
      headers: { wompi_hash: createHmac("sha256", webhookSecret).update(body).digest("hex") } }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, reason: "webhook_unavailable" });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][1].body).toContain('"error_code":"PROVIDER_UNAVAILABLE"');
    expect(fetch.mock.calls[0][1].body).not.toContain("private@example.com");
    expect(errors).toHaveBeenCalledOnce();
  });

  it("returns 400 for a signed but structurally incomplete payload", async () => {
    const body = '{"Monto":12.99}';
    const signature = createHmac("sha256", webhookSecret).update(body).digest("hex");
    const response = await POST(
      new Request("https://shop.test/api/webhooks/wompi", {
        body,
        headers: { wompi_hash: signature },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: "invalid_payload",
    });
  });
});
