import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { GuestCart } from "./cart";
import type { CheckoutInput } from "./checkout";
import {
  buildIntentFingerprint,
  cartFingerprint,
  cartMatchesOrder,
  idempotencyStateForOrder,
  isSameCheckoutIntent,
  replayResultForOrder,
  resolveP2002Recovery,
  type IdempotentOrderLookup,
} from "./orders";

const FUTURE = new Date(Date.now() + 10 * 60 * 1000);
const PAST = new Date(Date.now() - 10 * 60 * 1000);

function order(overrides: Partial<IdempotentOrderLookup> = {}): IdempotentOrderLookup {
  return {
    orderNumber: "CAP-20260817-ABC123",
    status: OrderStatus.PAYMENT_PROCESSING,
    userId: null,
    reservationExpiresAt: FUTURE,
    intentHash: "hash-abc",
    items: [{ skuSnapshot: "SKU-A", quantity: 2 }],
    payment: { checkoutUrl: "https://pay.example/checkout/abc" },
    ...overrides,
  };
}

function cart(lines: { sku: string; quantity: number }[]): GuestCart {
  return {
    hasBlockingIssues: false,
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    subtotalCents: 0,
    lines: lines.map((line) => ({
      availableQuantity: 99,
      lineTotalCents: 0,
      quantity: line.quantity,
      product: { sku: line.sku },
    })),
  } as GuestCart;
}

function input(overrides: Partial<CheckoutInput> = {}): CheckoutInput {
  return {
    customerEmail: "a@b.com",
    customerName: "Cliente",
    customerPhone: "77770000",
    fulfillmentMethod: "PICKUP",
    paymentMethod: "online_card",
    ...overrides,
  } as CheckoutInput;
}

describe("idempotencyStateForOrder", () => {
  it("replay: viva con checkoutUrl", () => {
    expect(idempotencyStateForOrder(order())).toBe("replay");
  });

  it("in_flight: viva pero sin checkoutUrl (carrera concurrente)", () => {
    expect(idempotencyStateForOrder(order({ payment: { checkoutUrl: null } }))).toBe("in_flight");
    expect(idempotencyStateForOrder(order({ payment: null }))).toBe("in_flight");
  });

  it("dead: reserva expirada / sin reserva / estado no PAYMENT_PROCESSING", () => {
    expect(idempotencyStateForOrder(order({ reservationExpiresAt: PAST }))).toBe("dead");
    expect(idempotencyStateForOrder(order({ reservationExpiresAt: null }))).toBe("dead");
    expect(idempotencyStateForOrder(order({ status: OrderStatus.CANCELLED }))).toBe("dead");
  });
});

describe("replayResultForOrder", () => {
  it("reutiliza el checkout de una orden en estado replay (sin accessToken)", () => {
    expect(replayResultForOrder(order())).toEqual({
      checkoutUrl: "https://pay.example/checkout/abc",
      orderNumber: "CAP-20260817-ABC123",
      status: "created",
    });
  });

  it("devuelve null en cualquier estado no-replay", () => {
    expect(replayResultForOrder(order({ reservationExpiresAt: PAST }))).toBeNull();
    expect(replayResultForOrder(order({ status: OrderStatus.CANCELLED }))).toBeNull();
    expect(replayResultForOrder(order({ payment: { checkoutUrl: null } }))).toBeNull();
  });
});

describe("cartFingerprint", () => {
  it("es igual para el mismo contenido en distinto orden", () => {
    const a = cartFingerprint(cart([{ sku: "SKU-A", quantity: 2 }, { sku: "SKU-B", quantity: 1 }]));
    const b = cartFingerprint(cart([{ sku: "SKU-B", quantity: 1 }, { sku: "SKU-A", quantity: 2 }]));
    expect(a).toBe(b);
  });

  it("difiere si cambia una cantidad", () => {
    expect(cartFingerprint(cart([{ sku: "SKU-A", quantity: 2 }]))).not.toBe(
      cartFingerprint(cart([{ sku: "SKU-A", quantity: 3 }])),
    );
  });
});

describe("cartMatchesOrder", () => {
  const items = [{ skuSnapshot: "SKU-A", quantity: 2 }];
  it("coincide con mismos SKUs y cantidades", () => {
    expect(cartMatchesOrder(cart([{ sku: "SKU-A", quantity: 2 }]), items)).toBe(true);
  });
  it("no coincide si cambia cantidad, SKU o número de líneas", () => {
    expect(cartMatchesOrder(cart([{ sku: "SKU-A", quantity: 3 }]), items)).toBe(false);
    expect(cartMatchesOrder(cart([{ sku: "SKU-Z", quantity: 2 }]), items)).toBe(false);
    expect(
      cartMatchesOrder(cart([{ sku: "SKU-A", quantity: 2 }, { sku: "SKU-B", quantity: 1 }]), items),
    ).toBe(false);
  });
});

describe("isSameCheckoutIntent", () => {
  const c = cart([{ sku: "SKU-A", quantity: 2 }]);

  it("carrito vacío siempre es el mismo intento (volver atrás tras la compra)", () => {
    expect(isSameCheckoutIntent(cart([]), "cualquier", order({ intentHash: "otra" }))).toBe(true);
  });

  it("con intentHash: compara por igualdad de hash", () => {
    expect(isSameCheckoutIntent(c, "hash-abc", order({ intentHash: "hash-abc" }))).toBe(true);
    expect(isSameCheckoutIntent(c, "hash-abc", order({ intentHash: "hash-xyz" }))).toBe(false);
  });

  it("orden legacy (intentHash NULL): cae a comparar items (red anti-duplicado)", () => {
    const legacy = order({ intentHash: null, items: [{ skuSnapshot: "SKU-A", quantity: 2 }] });
    expect(isSameCheckoutIntent(c, "hash-actual", legacy)).toBe(true);
    const legacyOtherItems = order({ intentHash: null, items: [{ skuSnapshot: "SKU-Z", quantity: 2 }] });
    expect(isSameCheckoutIntent(c, "hash-actual", legacyOtherItems)).toBe(false);
  });
});

describe("resolveP2002Recovery", () => {
  it("orden viva con checkout → replay con su resultado", () => {
    const rec = resolveP2002Recovery(order(), false);
    expect(rec.kind).toBe("replay");
    expect(rec).toMatchObject({ result: { status: "created", orderNumber: "CAP-20260817-ABC123" } });
  });

  it("orden muerta y sin reintento previo → release_and_retry", () => {
    expect(resolveP2002Recovery(order({ status: OrderStatus.CANCELLED }), false)).toEqual({
      kind: "release_and_retry",
    });
  });

  it("orden muerta pero YA reintentando → retry_signal (corta el loop)", () => {
    expect(resolveP2002Recovery(order({ status: OrderStatus.CANCELLED }), true)).toEqual({
      kind: "retry_signal",
    });
  });

  it("orden in_flight (viva, sin checkoutUrl) → retry_signal", () => {
    expect(resolveP2002Recovery(order({ payment: { checkoutUrl: null } }), false)).toEqual({
      kind: "retry_signal",
    });
  });

  it("sin orden hallada → retry_signal", () => {
    expect(resolveP2002Recovery(null, false)).toEqual({ kind: "retry_signal" });
  });
});

describe("buildIntentFingerprint", () => {
  const baseCart = cart([{ sku: "SKU-A", quantity: 1 }]);

  it("es estable para el mismo intento", () => {
    expect(buildIntentFingerprint(baseCart, input())).toBe(buildIntentFingerprint(baseCart, input()));
  });

  it("difiere si cambia la dirección, entrega o coords", () => {
    const base = buildIntentFingerprint(baseCart, input({ addressLine1: "Calle 1" }));
    expect(base).not.toBe(buildIntentFingerprint(baseCart, input({ addressLine1: "Calle 2" })));
    expect(buildIntentFingerprint(baseCart, input({ fulfillmentMethod: "PICKUP" }))).not.toBe(
      buildIntentFingerprint(baseCart, input({ fulfillmentMethod: "LOCAL_DELIVERY" })),
    );
    expect(buildIntentFingerprint(baseCart, input({ latitude: 13.7 }))).not.toBe(
      buildIntentFingerprint(baseCart, input({ latitude: 13.8 })),
    );
  });

  it("difiere si cambian email, nombre o teléfono del cliente", () => {
    const base = buildIntentFingerprint(baseCart, input());
    expect(base).not.toBe(buildIntentFingerprint(baseCart, input({ customerEmail: "typo@b.com" })));
    expect(base).not.toBe(buildIntentFingerprint(baseCart, input({ customerName: "Otro" })));
    expect(base).not.toBe(buildIntentFingerprint(baseCart, input({ customerPhone: "77779999" })));
  });
});
