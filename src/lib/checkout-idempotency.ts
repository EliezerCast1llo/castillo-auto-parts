import { randomBytes } from "node:crypto";

// Clave de idempotencia para el submit de checkout. Se genera una vez por render
// de la página y viaja como hidden input; dos clicks sobre la misma página envían
// el mismo valor, de modo que solo se crea una orden (constraint @unique en DB).
const IDEMPOTENCY_KEY_BYTES = 32;
const IDEMPOTENCY_KEY_PATTERN = /^[a-f0-9]{64}$/;

export function createCheckoutIdempotencyKey() {
  return randomBytes(IDEMPOTENCY_KEY_BYTES).toString("hex");
}

export function normalizeCheckoutIdempotencyKey(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  return IDEMPOTENCY_KEY_PATTERN.test(trimmed) ? trimmed : undefined;
}
