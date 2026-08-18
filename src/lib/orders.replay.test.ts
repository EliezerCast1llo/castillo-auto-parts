import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { replayResultForOrder, type IdempotentOrderLookup } from "./orders";

const FUTURE = new Date(Date.now() + 10 * 60 * 1000);
const PAST = new Date(Date.now() - 10 * 60 * 1000);

function order(overrides: Partial<IdempotentOrderLookup> = {}): IdempotentOrderLookup {
  return {
    orderNumber: "CAP-20260817-ABC123",
    status: OrderStatus.PAYMENT_PROCESSING,
    reservationExpiresAt: FUTURE,
    payment: { checkoutUrl: "https://pay.example/checkout/abc" },
    ...overrides,
  };
}

describe("replayResultForOrder", () => {
  it("reutiliza el checkout de una orden viva con checkoutUrl", () => {
    const result = replayResultForOrder(order());
    expect(result).toEqual({
      accessToken: "",
      checkoutUrl: "https://pay.example/checkout/abc",
      orderNumber: "CAP-20260817-ABC123",
      status: "created",
    });
  });

  it("no reutiliza si la reserva ya expiró", () => {
    expect(replayResultForOrder(order({ reservationExpiresAt: PAST }))).toBeNull();
  });

  it("no reutiliza si no hay reservationExpiresAt", () => {
    expect(replayResultForOrder(order({ reservationExpiresAt: null }))).toBeNull();
  });

  it("no reutiliza si el estado no es PAYMENT_PROCESSING", () => {
    expect(replayResultForOrder(order({ status: OrderStatus.CANCELLED }))).toBeNull();
    expect(replayResultForOrder(order({ status: OrderStatus.PAID_PENDING_SHIPMENT }))).toBeNull();
  });

  it("no reutiliza si el pago aún no tiene checkoutUrl", () => {
    expect(replayResultForOrder(order({ payment: { checkoutUrl: null } }))).toBeNull();
    expect(replayResultForOrder(order({ payment: null }))).toBeNull();
  });
});
