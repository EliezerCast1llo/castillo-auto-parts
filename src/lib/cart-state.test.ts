import { describe, expect, it } from "vitest";
import {
  parseStoredCart,
  removeStoredCartItem,
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
});
