import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  InvalidWompiWebhookSignatureError,
  createWompiPaymentProvider,
  verifyWompiWebhookSignature,
  type WompiConfig,
} from "./wompi-provider";

const config: WompiConfig = {
  apiBaseUrl: "https://api.wompi.test",
  apiSecret: "test-api-secret",
  appId: "test-app-id",
  environment: "sandbox",
  identityBaseUrl: "https://id.wompi.test",
  webhookSecret: "test-webhook-secret",
  webhookUrl: "https://shop.test/api/webhooks/wompi",
};

describe("Wompi payment provider", () => {
  it("authenticates server-side and creates a non-editable single-use payment link", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "oauth-token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          estaProductivo: false,
          idEnlace: 42,
          urlEnlace: "https://lk.wompi.test/abc",
        }),
      );
    const provider = createWompiPaymentProvider(config, fetchMock);

    const result = await provider.createPayment({
      amountCents: 1299,
      currency: "USD",
      customerEmail: "customer@example.com",
      orderNumber: "CAP-TEST-001",
      redirectUrl: "https://shop.test/orders/CAP-TEST-001?token=secret",
    });

    expect(result).toMatchObject({
      checkoutUrl: "https://lk.wompi.test/abc",
      externalPaymentId: "42",
      externalReference: "CAP-TEST-001",
      provider: "wompi",
      status: "PENDING",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://id.wompi.test/connect/token");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.wompi.test/EnlacePago");

    const tokenBody = fetchMock.mock.calls[0]?.[1]?.body;
    expect(tokenBody).toBeInstanceOf(URLSearchParams);
    expect((tokenBody as URLSearchParams).get("client_secret")).toBe(config.apiSecret);

    const linkBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(linkBody).toMatchObject({
      configuracion: {
        cantidadPorDefecto: 1,
        esCantidadEditable: false,
        esMontoEditable: false,
        urlWebhook: config.webhookUrl,
      },
      identificadorEnlaceComercio: "CAP-TEST-001",
      limitesDeUso: { cantidadMaximaPagosExitosos: 1 },
      monto: 12.99,
    });
  });

  it("validates the raw webhook body and normalizes a successful event", async () => {
    const provider = createWompiPaymentProvider(config, vi.fn<typeof fetch>());
    const rawBody = JSON.stringify(buildWebhookPayload());
    const signature = sign(rawBody, config.webhookSecret);
    const request = new Request("https://shop.test/api/webhooks/wompi", {
      body: rawBody,
      headers: { "content-type": "application/json", wompi_hash: signature },
      method: "POST",
    });

    await expect(provider.verifyWebhook(request)).resolves.toMatchObject({
      amountCents: 1299,
      externalEventId: "attempt-001",
      externalPaymentId: "42",
      externalReference: "CAP-TEST-001",
      isProduction: false,
      isValid: true,
      provider: "wompi",
      status: "PAID",
    });
  });

  it("rejects a modified body even when the payload remains valid JSON", async () => {
    const provider = createWompiPaymentProvider(config, vi.fn<typeof fetch>());
    const originalBody = JSON.stringify(buildWebhookPayload());
    const modifiedBody = originalBody.replace("12.99", "1.99");
    const request = new Request("https://shop.test/api/webhooks/wompi", {
      body: modifiedBody,
      headers: { wompi_hash: sign(originalBody, config.webhookSecret) },
      method: "POST",
    });

    await expect(provider.verifyWebhook(request)).rejects.toBeInstanceOf(
      InvalidWompiWebhookSignatureError,
    );
  });
});

describe("verifyWompiWebhookSignature", () => {
  it("uses a constant-time comparison for a valid hex HMAC", () => {
    const body = '{"Monto":12.99}';
    expect(verifyWompiWebhookSignature(body, sign(body, "secret"), "secret")).toBe(true);
    expect(verifyWompiWebhookSignature(`${body} `, sign(body, "secret"), "secret")).toBe(false);
    expect(verifyWompiWebhookSignature(body, "not-hex", "secret")).toBe(false);
  });
});

function buildWebhookPayload() {
  return {
    EnlacePago: {
      Id: 42,
      IdentificadorEnlaceComercio: "CAP-TEST-001",
      NombreProducto: "Orden CAP-TEST-001",
    },
    EsProductiva: false,
    FechaTransaccion: "2026-06-21T12:00:00-06:00",
    IdIntentoPago: "attempt-001",
    IdTransaccion: "transaction-001",
    Monto: 12.99,
    ResultadoTransaccion: "ExitosaAprobada",
  };
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}
