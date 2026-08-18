import { describe, expect, it } from "vitest";
import {
  createCheckoutIdempotencyKey,
  normalizeCheckoutIdempotencyKey,
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
