import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
