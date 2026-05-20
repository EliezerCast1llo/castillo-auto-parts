import { mockPaymentProvider } from "./mock-provider";
import { isPaymentProviderId, type PaymentProvider, type PaymentProviderId } from "./provider";

export { buildMockPaymentId, mockPaymentProvider } from "./mock-provider";
export type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  PaymentProviderId,
  PaymentStatus,
  PaymentWebhookEvent,
} from "./provider";

export function getPaymentProvider(
  providerId = process.env.PAYMENT_PROVIDER,
  environment = process.env.NODE_ENV,
): PaymentProvider {
  const resolvedProviderId = resolvePaymentProviderId(providerId);

  if (resolvedProviderId === "mock") {
    assertPaymentProviderAllowed(resolvedProviderId, environment);
    return mockPaymentProvider;
  }

  throw new Error(`Payment provider "${resolvedProviderId}" is not implemented yet.`);
}

export function resolvePaymentProviderId(providerId?: string): PaymentProviderId {
  const normalizedProviderId = providerId?.trim() || "mock";
  if (isPaymentProviderId(normalizedProviderId)) return normalizedProviderId;

  throw new Error(`Unsupported payment provider "${normalizedProviderId}".`);
}

export function assertPaymentProviderAllowed(providerId: PaymentProviderId, environment = process.env.NODE_ENV) {
  if (environment === "production" && providerId === "mock") {
    throw new Error("The mock payment provider cannot be used in production.");
  }
}
