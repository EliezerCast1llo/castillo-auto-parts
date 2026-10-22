import { createHash, randomBytes } from "node:crypto";

// Clave de idempotencia para el submit de checkout. Se genera una vez por render
// de la página y viaja como hidden input; dos clicks sobre la misma página envían
// el mismo valor, de modo que solo se crea una orden (constraint @unique en DB).
const IDEMPOTENCY_KEY_BYTES = 32;
const IDEMPOTENCY_KEY_PATTERN = /^[a-f0-9]{64}$/;

// Cookie httpOnly que preserva la idempotencyKey del submit que quedó en
// duplicate_in_progress. Permite reintentar reusando la MISMA key (reproduce en
// vez de duplicar) sin dejar al cliente en una página sin salida.
export const CHECKOUT_RETRY_KEY_COOKIE = "castillo_checkout_retry_key";

// TTL de la cookie de reintento: debe cubrir toda la vida de la reserva de la
// orden en curso (20 min), no una espera asumida de segundos. Si expira antes, el
// reintento acuñaría una key nueva y crearía una segunda orden con su reserva.
export const CHECKOUT_RETRY_KEY_MAX_AGE_SECONDS = 20 * 60;

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

// La cookie de reintento SOLO se conserva en duplicate_in_progress (y si hubo key).
// En cualquier otro desenlace se limpia, para que una key vieja no quede colgada.
// (La decisión de ADOPTAR la key en la página se hace inline sobre el carrito no
// vacío, no acá: era una función identidad sin lógica propia.)
export function shouldPreserveRetryKey(status: string, hasKey: boolean): boolean {
  return status === "duplicate_in_progress" && hasKey;
}
