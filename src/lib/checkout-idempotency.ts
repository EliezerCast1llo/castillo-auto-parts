import { createHash, randomBytes } from "node:crypto";

// Clave de idempotencia para el submit de checkout. Se genera una vez por render
// de la página y viaja como hidden input; dos clicks sobre la misma página envían
// el mismo valor, de modo que solo se crea una orden (constraint @unique en DB).
const IDEMPOTENCY_KEY_BYTES = 32;
const IDEMPOTENCY_KEY_PATTERN = /^[a-f0-9]{64}$/;

// Cookie httpOnly, corta, que preserva la idempotencyKey del submit que quedó en
// duplicate_in_progress. Permite reintentar reusando la MISMA key (reproduce en
// vez de duplicar) sin dejar al cliente en una página sin salida.
export const CHECKOUT_RETRY_KEY_COOKIE = "castillo_checkout_retry_key";

export function createCheckoutIdempotencyKey() {
  return randomBytes(IDEMPOTENCY_KEY_BYTES).toString("hex");
}

export function normalizeCheckoutIdempotencyKey(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  return IDEMPOTENCY_KEY_PATTERN.test(trimmed) ? trimmed : undefined;
}

// Deriva una key determinística de (key original + huella del carrito). Se usa
// cuando la key original no aplica (pertenece a otro usuario, o el carrito cambió):
// dos requests concurrentes idénticos derivan la MISMA key y siguen deduplicando,
// en vez de quedar con key null (que no colisiona bajo el índice único → duplica).
export function deriveScopedIdempotencyKey(baseKey: string, fingerprint: string): string {
  return createHash("sha256").update(`${baseKey}:${fingerprint}`).digest("hex");
}

// Hash de la huella del intento (items + entrega + dirección). Se guarda en la
// orden para decidir si un re-submit es "el mismo intento" (reproducir) o cambió
// algo material como la dirección (crear orden nueva, no pagar con la vieja).
export function hashCheckoutIntent(fingerprint: string): string {
  return createHash("sha256").update(fingerprint).digest("hex");
}
