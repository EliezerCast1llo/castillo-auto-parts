import { describe, expect, it } from "vitest";
import { CART_MAX_LINE_QUANTITY } from "./cart-validation";
import {
  mergeStoredCarts,
  parseStoredCart,
  parseSignedStoredCart,
  removeStoredCartItem,
  serializeSignedStoredCart,
  serializeStoredCart,
  setStoredCartItemQuantity,
  upsertStoredCartItem,
} from "./cart-state";

describe("cart state", () => {
  it("parses valid stored cart items", () => {
    const items = parseStoredCart('[{"sku":"A-1","quantity":2},{"sku":"B-1","quantity":1}]');

    expect(items).toEqual([
      { sku: "A-1", quantity: 2 },
      { sku: "B-1", quantity: 1 },
    ]);
  });

  it("ignores invalid cart payloads", () => {
    expect(parseStoredCart("not-json")).toEqual([]);
    expect(parseStoredCart('{"sku":"A-1"}')).toEqual([]);
  });

  it("adds quantities without exceeding stock", () => {
    const items = upsertStoredCartItem([{ sku: "A-1", quantity: 2 }], "A-1", 5, 4);

    expect(items).toEqual([{ sku: "A-1", quantity: 4 }]);
  });

  it("sets and removes quantities", () => {
    const items = setStoredCartItemQuantity(
      [
        { sku: "A-1", quantity: 2 },
        { sku: "B-1", quantity: 1 },
      ],
      "A-1",
      0,
      5,
    );

    expect(items).toEqual([{ sku: "B-1", quantity: 1 }]);
    expect(removeStoredCartItem(items, "B-1")).toEqual([]);
  });

  it("serializes normalized cart items", () => {
    const serialized = serializeStoredCart([
      { sku: "A-1", quantity: 1 },
      { sku: "A-1", quantity: 2 },
    ]);

    expect(serialized).toBe('[{"sku":"A-1","quantity":3}]');
  });

  it("drops invalid SKUs and caps excessive quantities", () => {
    const serialized = serializeStoredCart([
      { sku: "A-1", quantity: 98 },
      { sku: "A-1", quantity: 10 },
      { sku: "bad sku", quantity: 2 },
      { sku: "B-1", quantity: 150 },
    ]);

    expect(serialized).toBe('[{"sku":"A-1","quantity":99},{"sku":"B-1","quantity":99}]');
  });

  it("signs and verifies stored cart items", () => {
    const secret = "cart-secret";
    const signedCart = serializeSignedStoredCart([{ sku: "A-1", quantity: 2 }], secret);

    expect(signedCart).toMatch(/^v1\./);
    expect(parseSignedStoredCart(signedCart, secret)).toEqual([{ sku: "A-1", quantity: 2 }]);
    expect(parseSignedStoredCart(`${signedCart}tampered`, secret)).toEqual([]);
  });

  it("verifica contra varios secretos para permitir rotación sin vaciar carritos", () => {
    const oldSecret = "admin-access-secret";
    const newSecret = "guest-cart-secret";
    const signedWithOld = serializeSignedStoredCart([{ sku: "A-1", quantity: 2 }], oldSecret);

    // Firmado con el viejo, se acepta mientras el viejo siga en la lista de verificación.
    expect(parseSignedStoredCart(signedWithOld, [newSecret, oldSecret])).toEqual([
      { sku: "A-1", quantity: 2 },
    ]);
    // Si el viejo ya no está entre los aceptados, la firma vieja se rechaza.
    expect(parseSignedStoredCart(signedWithOld, [newSecret])).toEqual([]);
  });

  it("only accepts unsigned legacy payloads when fallback is enabled", () => {
    const legacyCart = '[{"sku":"A-1","quantity":2}]';

    expect(parseSignedStoredCart(legacyCart, "cart-secret")).toEqual([]);
    expect(parseSignedStoredCart(legacyCart, "cart-secret", { allowUnsignedFallback: true })).toEqual([
      { sku: "A-1", quantity: 2 },
    ]);
  });
});

describe("mergeStoredCarts", () => {
  it("suma las cantidades del mismo SKU", () => {
    // Quien agregó dos antes de entrar y uno después eligió las dos veces.
    // Quedarse con una sola de las dos decisiones pierde la otra en silencio.
    expect(mergeStoredCarts([{ sku: "SKU-A", quantity: 2 }], [{ sku: "SKU-A", quantity: 1 }])).toEqual([
      { sku: "SKU-A", quantity: 3 },
    ]);
  });

  it("conserva los SKU que están en uno solo de los dos", () => {
    const merged = mergeStoredCarts([{ sku: "SKU-A", quantity: 1 }], [{ sku: "SKU-B", quantity: 2 }]);

    expect(merged).toHaveLength(2);
    expect(merged).toEqual(
      expect.arrayContaining([
        { sku: "SKU-A", quantity: 1 },
        { sku: "SKU-B", quantity: 2 },
      ]),
    );
  });

  it("respeta el tope por línea al sumar", () => {
    const merged = mergeStoredCarts(
      [{ sku: "SKU-A", quantity: CART_MAX_LINE_QUANTITY }],
      [{ sku: "SKU-A", quantity: 5 }],
    );

    expect(merged).toEqual([{ sku: "SKU-A", quantity: CART_MAX_LINE_QUANTITY }]);
  });

  it("devuelve el otro carrito cuando uno está vacío", () => {
    expect(mergeStoredCarts([], [{ sku: "SKU-A", quantity: 2 }])).toEqual([
      { sku: "SKU-A", quantity: 2 },
    ]);
    expect(mergeStoredCarts([{ sku: "SKU-A", quantity: 2 }], [])).toEqual([
      { sku: "SKU-A", quantity: 2 },
    ]);
  });
});
