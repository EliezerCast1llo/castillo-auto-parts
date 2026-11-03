import { mockPaymentProvider } from "./mock-provider";
import { OperationalError } from "../operational-error";
import { isIsolatedE2EEnvironment } from "../production-environment";
import { isPaymentProviderId, type PaymentProvider, type PaymentProviderId } from "./provider";
import { createWompiPaymentProvider, getWompiConfig } from "./wompi-provider";

export { buildMockPaymentId, mockPaymentProvider } from "./mock-provider";
export {
  createWompiPaymentProvider,
  getWompiConfig,
  InvalidWompiWebhookSignatureError,
  verifyWompiWebhookSignature,
} from "./wompi-provider";
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

  if (resolvedProviderId === "wompi") {
    return createWompiPaymentProvider(getWompiConfig());
  }

  throw new OperationalError("CONFIG_INVALID", "Payment provider is not implemented yet.");
}

export function resolvePaymentProviderId(providerId?: string): PaymentProviderId {
  const normalizedProviderId = providerId?.trim() || "mock";
  if (isPaymentProviderId(normalizedProviderId)) return normalizedProviderId;

  throw new OperationalError("CONFIG_INVALID", "Unsupported payment provider.");
}

export function assertPaymentProviderAllowed(providerId: PaymentProviderId, environment = process.env.NODE_ENV) {
  if (environment === "production" && providerId === "mock" && !isE2EMockPaymentAllowed()) {
    throw new OperationalError("CONFIG_INVALID", "The mock payment provider cannot be used in production.");
  }
}

function isE2EMockPaymentAllowed() {
  return isIsolatedE2EEnvironment();
}
