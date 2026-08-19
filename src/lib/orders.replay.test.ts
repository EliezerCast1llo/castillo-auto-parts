import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { GuestCart } from "./cart";
import type { CheckoutInput } from "./checkout";
import {
  buildIntentFingerprint,
  cartFingerprint,
  idempotencyStateForOrder,
  replayResultForOrder,
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

describe("buildIntentFingerprint", () => {
  const baseCart = cart([{ sku: "SKU-A", quantity: 1 }]);

  it("es estable para el mismo intento", () => {
    const a = buildIntentFingerprint(baseCart, input({ addressLine1: "Calle 1" }));
    const b = buildIntentFingerprint(baseCart, input({ addressLine1: "Calle 1" }));
    expect(a).toBe(b);
  });

  it("difiere si cambia la dirección (mismos items)", () => {
    const a = buildIntentFingerprint(baseCart, input({ addressLine1: "Calle 1" }));
    const b = buildIntentFingerprint(baseCart, input({ addressLine1: "Calle 2" }));
    expect(a).not.toBe(b);
  });

  it("difiere si cambia el método de entrega", () => {
    const a = buildIntentFingerprint(baseCart, input({ fulfillmentMethod: "PICKUP" }));
    const b = buildIntentFingerprint(baseCart, input({ fulfillmentMethod: "LOCAL_DELIVERY" }));
    expect(a).not.toBe(b);
  });

  it("difiere si cambian las coordenadas", () => {
    const a = buildIntentFingerprint(baseCart, input({ latitude: 13.7, longitude: -89.2 }));
    const b = buildIntentFingerprint(baseCart, input({ latitude: 13.8, longitude: -89.2 }));
    expect(a).not.toBe(b);
  });
});
