import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
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
    payment: { checkoutUrl: "https://pay.example/checkout/abc" },
    ...overrides,
  };
}

describe("idempotencyStateForOrder", () => {
  it("replay: viva con checkoutUrl", () => {
    expect(idempotencyStateForOrder(order())).toBe("replay");
  });

  it("in_flight: viva pero sin checkoutUrl (carrera concurrente)", () => {
    expect(idempotencyStateForOrder(order({ payment: { checkoutUrl: null } }))).toBe("in_flight");
    expect(idempotencyStateForOrder(order({ payment: null }))).toBe("in_flight");
  });

  it("dead: reserva expirada", () => {
    expect(idempotencyStateForOrder(order({ reservationExpiresAt: PAST }))).toBe("dead");
  });

  it("dead: sin reservationExpiresAt", () => {
    expect(idempotencyStateForOrder(order({ reservationExpiresAt: null }))).toBe("dead");
  });

  it("dead: estado no PAYMENT_PROCESSING", () => {
    expect(idempotencyStateForOrder(order({ status: OrderStatus.CANCELLED }))).toBe("dead");
    expect(idempotencyStateForOrder(order({ status: OrderStatus.PAID_PENDING_SHIPMENT }))).toBe("dead");
  });
});

describe("replayResultForOrder", () => {
  it("reutiliza el checkout de una orden en estado replay (sin accessToken)", () => {
    const result = replayResultForOrder(order());
    expect(result).toEqual({
      checkoutUrl: "https://pay.example/checkout/abc",
      orderNumber: "CAP-20260817-ABC123",
      status: "created",
    });
  });

  it("devuelve null en cualquier estado no-replay", () => {
    expect(replayResultForOrder(order({ reservationExpiresAt: PAST }))).toBeNull();
    expect(replayResultForOrder(order({ reservationExpiresAt: null }))).toBeNull();
    expect(replayResultForOrder(order({ status: OrderStatus.CANCELLED }))).toBeNull();
    expect(replayResultForOrder(order({ payment: { checkoutUrl: null } }))).toBeNull();
    expect(replayResultForOrder(order({ payment: null }))).toBeNull();
  });
});
