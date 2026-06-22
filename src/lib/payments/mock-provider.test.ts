import { describe, expect, it } from "vitest";
import { getPaymentProvider, resolvePaymentProviderId } from ".";
import { buildMockPaymentId, mockPaymentProvider } from "./mock-provider";

describe("mock payment provider", () => {
  it("creates a pending mock checkout result", async () => {
    const payment = await mockPaymentProvider.createPayment({
      amountCents: 1790,
      currency: "USD",
      customerEmail: "cliente@example.com",
      orderNumber: "CAP-20260519-ABC123",
      redirectUrl: "http://localhost:3000/orders/CAP-20260519-ABC123?token=test",
    });

    expect(payment).toMatchObject({
      externalPaymentId: "MOCK-CAP-20260519-ABC123",
      externalReference: "CAP-20260519-ABC123",
      provider: "mock",
      rawStatus: "SIMULATED_PENDING",
      status: "PENDING",
    });
    expect(payment.checkoutUrl).toContain(
      "/payments/mock/MOCK-CAP-20260519-ABC123?returnTo=",
    );
    expect(payment.paidAt).toBeUndefined();
  });

  it("verifies valid mock webhook payloads", async () => {
    const request = new Request("http://localhost/api/payments/mock/webhook", {
      body: JSON.stringify({
        amountCents: 1790,
        externalEventId: "evt_mock_1",
        externalPaymentId: buildMockPaymentId("CAP-20260519-ABC123"),
        externalReference: "CAP-20260519-ABC123",
        status: "PAID",
      }),
      method: "POST",
    });

    await expect(mockPaymentProvider.verifyWebhook(request)).resolves.toMatchObject({
      externalPaymentId: "MOCK-CAP-20260519-ABC123",
      amountCents: 1790,
      isValid: true,
      provider: "mock",
      status: "PAID",
    });
  });

  it("defaults provider resolution to mock", () => {
    expect(resolvePaymentProviderId()).toBe("mock");
    expect(getPaymentProvider("mock")).toBe(mockPaymentProvider);
  });

  it("blocks the mock provider in production", () => {
    expect(() => getPaymentProvider("mock", "production")).toThrow(
      "The mock payment provider cannot be used in production.",
    );
  });

  it("allows the mock provider only for isolated E2E runs", () => {
    const originalE2EFlag = process.env.E2E_ISOLATED_DATABASE;
    const originalAllowFlag = process.env.ALLOW_MOCK_PAYMENT_IN_E2E;

    process.env.E2E_ISOLATED_DATABASE = "true";
    process.env.ALLOW_MOCK_PAYMENT_IN_E2E = "true";

    try {
      expect(getPaymentProvider("mock", "production")).toBe(mockPaymentProvider);
    } finally {
      restoreEnv("E2E_ISOLATED_DATABASE", originalE2EFlag);
      restoreEnv("ALLOW_MOCK_PAYMENT_IN_E2E", originalAllowFlag);
    }
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
