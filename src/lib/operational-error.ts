/** Closed diagnostic vocabulary: never derive a code from a provider message or name. */
export const OPERATIONAL_ERROR_CODES = [
  "CONFIG_MISSING", "CONFIG_INVALID", "PROVIDER_UNAVAILABLE", "PROVIDER_REJECTED",
  "WEBHOOK_SIGNATURE_INVALID", "SHIPPING_RATE_UNAVAILABLE",
] as const;
export type OperationalErrorCode = typeof OPERATIONAL_ERROR_CODES[number];

export class OperationalError extends Error {
  constructor(readonly code: OperationalErrorCode, message: string) {
    super(message);
    this.name = "OperationalError";
  }
}

export function isOperationalErrorCode(value: unknown): value is OperationalErrorCode {
  return typeof value === "string" && (OPERATIONAL_ERROR_CODES as readonly string[]).includes(value);
}

/** SDK errors can contain URLs, request bodies and credentials; discard them at the boundary. */
export function providerFailure(error: unknown, message: string) {
  if (error instanceof OperationalError) return error;
  const status = (error as { $metadata?: { httpStatusCode?: number } } | null)?.$metadata?.httpStatusCode;
  return new OperationalError(status && status >= 400 && status < 500
    ? "PROVIDER_REJECTED" : "PROVIDER_UNAVAILABLE", message);
}
