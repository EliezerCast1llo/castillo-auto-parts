import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as payments from "@/lib/payments";
import { POST } from "./route";

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
