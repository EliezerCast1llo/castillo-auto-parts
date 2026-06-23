import { assertPaymentProviderAllowed } from ".";

export function isMockPaymentAvailable() {
  if ((process.env.PAYMENT_PROVIDER?.trim() || "mock") !== "mock") return false;

  try {
    assertPaymentProviderAllowed("mock");
    return true;
  } catch {
    return false;
  }
}
