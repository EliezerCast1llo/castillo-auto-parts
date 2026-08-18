import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { GuestCart } from "./cart";
import {
  cartFingerprint,
  cartMatchesOrder,
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

describe("cartMatchesOrder", () => {
  it("coincide con mismos SKUs y cantidades (independiente del orden)", () => {
    const items = [
      { skuSnapshot: "SKU-A", quantity: 2 },
      { skuSnapshot: "SKU-B", quantity: 1 },
    ];
    expect(cartMatchesOrder(cart([{ sku: "SKU-B", quantity: 1 }, { sku: "SKU-A", quantity: 2 }]), items)).toBe(true);
  });

  it("no coincide si cambia una cantidad", () => {
    const items = [{ skuSnapshot: "SKU-A", quantity: 2 }];
    expect(cartMatchesOrder(cart([{ sku: "SKU-A", quantity: 3 }]), items)).toBe(false);
  });

  it("no coincide si cambia un SKU o el número de líneas", () => {
    const items = [{ skuSnapshot: "SKU-A", quantity: 2 }];
    expect(cartMatchesOrder(cart([{ sku: "SKU-Z", quantity: 2 }]), items)).toBe(false);
    expect(
      cartMatchesOrder(cart([{ sku: "SKU-A", quantity: 2 }, { sku: "SKU-B", quantity: 1 }]), items),
    ).toBe(false);
  });

  it("un carrito vacío no coincide con una orden con items", () => {
    expect(cartMatchesOrder(cart([]), [{ skuSnapshot: "SKU-A", quantity: 2 }])).toBe(false);
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
