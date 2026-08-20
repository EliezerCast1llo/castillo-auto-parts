import { describe, expect, it } from "vitest";
import {
  createCheckoutIdempotencyKey,
  deriveScopedIdempotencyKey,
  normalizeCheckoutIdempotencyKey,
  shouldPreserveRetryKey,
} from "./checkout-idempotency";

describe("createCheckoutIdempotencyKey", () => {
  it("genera 64 chars hex", () => {
    const key = createCheckoutIdempotencyKey();
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  it("genera claves distintas en cada llamada", () => {
    expect(createCheckoutIdempotencyKey()).not.toBe(createCheckoutIdempotencyKey());
  });
});

describe("normalizeCheckoutIdempotencyKey", () => {
  it("acepta una key válida y la deja en minúsculas", () => {
    const key = createCheckoutIdempotencyKey();
    expect(normalizeCheckoutIdempotencyKey(key.toUpperCase())).toBe(key);
  });

  it("recorta espacios alrededor", () => {
    const key = createCheckoutIdempotencyKey();
    expect(normalizeCheckoutIdempotencyKey(`  ${key}  `)).toBe(key);
  });

  it("rechaza formatos inválidos", () => {
    expect(normalizeCheckoutIdempotencyKey("")).toBeUndefined();
    expect(normalizeCheckoutIdempotencyKey("no-hex-value")).toBeUndefined();
    expect(normalizeCheckoutIdempotencyKey("abc123")).toBeUndefined();
    expect(normalizeCheckoutIdempotencyKey("g".repeat(64))).toBeUndefined();
    expect(normalizeCheckoutIdempotencyKey("a".repeat(63))).toBeUndefined();
  });

  it("rechaza valores no string", () => {
    expect(normalizeCheckoutIdempotencyKey(null)).toBeUndefined();
    expect(normalizeCheckoutIdempotencyKey(undefined)).toBeUndefined();
    expect(normalizeCheckoutIdempotencyKey(123)).toBeUndefined();
    expect(normalizeCheckoutIdempotencyKey(new File([], "x"))).toBeUndefined();
  });
});

describe("deriveScopedIdempotencyKey", () => {
  it("es determinística para la misma key + huella (dedup concurrente)", () => {
    expect(deriveScopedIdempotencyKey("base", "SKU-A:2")).toBe(
      deriveScopedIdempotencyKey("base", "SKU-A:2"),
    );
  });

  it("difiere si cambia la huella del carrito", () => {
    expect(deriveScopedIdempotencyKey("base", "SKU-A:2")).not.toBe(
      deriveScopedIdempotencyKey("base", "SKU-A:3"),
    );
  });

  it("difiere si cambia la key base", () => {
    expect(deriveScopedIdempotencyKey("base1", "SKU-A:2")).not.toBe(
      deriveScopedIdempotencyKey("base2", "SKU-A:2"),
    );
  });

  it("produce 64 hex (mismo formato que la key normal)", () => {
    expect(deriveScopedIdempotencyKey("base", "SKU-A:2")).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("shouldPreserveRetryKey", () => {
  it("conserva la cookie solo en duplicate_in_progress con key", () => {
    expect(shouldPreserveRetryKey("duplicate_in_progress", true)).toBe(true);
  });

  it("la limpia sin key, o en cualquier otro estado", () => {
    expect(shouldPreserveRetryKey("duplicate_in_progress", false)).toBe(false);
    expect(shouldPreserveRetryKey("created", true)).toBe(false);
    expect(shouldPreserveRetryKey("payment_unavailable", true)).toBe(false);
    expect(shouldPreserveRetryKey("empty_cart", true)).toBe(false);
    expect(shouldPreserveRetryKey("invalid", true)).toBe(false);
  });
});

