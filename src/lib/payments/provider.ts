export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";

export type CreatePaymentInput = {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: "USD";
  customerEmail: string;
  redirectUrl: string;
};

export type CreatePaymentResult = {
  provider: "wompi" | "manual" | "mock";
  externalPaymentId: string;
  checkoutUrl: string;
  status: PaymentStatus;
};

export type PaymentWebhookEvent = {
  provider: "wompi" | "manual" | "mock";
  externalPaymentId: string;
  status: PaymentStatus;
  rawPayload: unknown;
};

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhook(request: Request): Promise<PaymentWebhookEvent>;
  getPaymentStatus(externalPaymentId: string): Promise<PaymentStatus>;
}

