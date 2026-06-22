import type {
  PaymentProvider,
  PaymentStatus,
} from "./provider";

export const mockPaymentProvider: PaymentProvider = {
  id: "mock",

  async createPayment(input) {
    const externalPaymentId = buildMockPaymentId(input.orderNumber);
    const checkoutUrl = new URL(
      `/payments/mock/${encodeURIComponent(externalPaymentId)}`,
      input.redirectUrl,
    );
    checkoutUrl.searchParams.set("returnTo", input.redirectUrl);

    return {
      checkoutUrl: checkoutUrl.toString(),
      externalPaymentId,
      externalReference: input.orderNumber,
      provider: "mock",
      rawPayload: {
        amountCents: input.amountCents,
        currency: input.currency,
        customerEmail: input.customerEmail,
        metadata: input.metadata ?? {},
        orderNumber: input.orderNumber,
        type: "mock.payment.created",
      },
      rawStatus: "SIMULATED_PENDING",
      status: "PENDING",
    };
  },

  async verifyWebhook(request) {
    const payload = await readJsonPayload(request);
    const externalPaymentId = stringValue(payload.externalPaymentId) ?? "";
    const externalReference = stringValue(payload.externalReference);
    const status = parsePaymentStatus(stringValue(payload.status));

    return {
      amountCents: numberValue(payload.amountCents),
      eventType: "mock.webhook.received",
      externalEventId: stringValue(payload.externalEventId),
      externalPaymentId,
      externalReference,
      isValid: Boolean(externalPaymentId && status),
      isProduction: false,
      provider: "mock",
      rawPayload: payload,
      status: status ?? "FAILED",
    };
  },

};

export function buildMockPaymentId(orderNumber: string) {
  return `MOCK-${orderNumber}`;
}

function parsePaymentStatus(value: string | undefined): PaymentStatus | undefined {
  if (
    value === "PENDING" ||
    value === "PAID" ||
    value === "FAILED" ||
    value === "CANCELLED" ||
    value === "REFUNDED"
  ) {
    return value;
  }

  return undefined;
}

async function readJsonPayload(request: Request) {
  try {
    const payload = await request.json();
    return isRecord(payload) ? payload : {};
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}
