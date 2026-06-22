export const paymentProviderIds = ["mock", "wompi", "pagadito", "bac_manual"] as const;

export type PaymentProviderId = (typeof paymentProviderIds)[number];

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";

export type CreatePaymentInput = {
  orderNumber: string;
  amountCents: number;
  currency: "USD";
  customerEmail: string;
  redirectUrl: string;
  metadata?: Record<string, string>;
};

export type CreatePaymentResult = {
  provider: PaymentProviderId;
  externalPaymentId: string;
  externalReference: string;
  checkoutUrl: string;
  paidAt?: Date;
  rawPayload: unknown;
  rawStatus: string;
  status: PaymentStatus;
};

export type PaymentWebhookEvent = {
  amountCents?: number;
  provider: PaymentProviderId;
  eventType: string;
  externalEventId?: string;
  externalPaymentId: string;
  externalReference?: string;
  isProduction?: boolean;
  isValid: boolean;
  occurredAt?: Date;
  status: PaymentStatus;
  rawPayload: unknown;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhook(request: Request): Promise<PaymentWebhookEvent>;
}

export function isPaymentProviderId(value: string): value is PaymentProviderId {
  return paymentProviderIds.includes(value as PaymentProviderId);
}
