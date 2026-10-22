import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import es from "./i18n/messages/es";
import { getOrderTrackingState } from "./order-tracking";

describe("getOrderTrackingState", () => {
  it("maps PAID_PENDING_SHIPMENT + LOCAL_DELIVERY to preparing delivery", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.PAID_PENDING_SHIPMENT,
    });

    expect(state.labelKey).toBe("preparing");
    expect(state.fulfillmentKey).toBe("delivery");
    expect(state.steps.map((step) => step.key)).toEqual([
      "confirmed",
      "preparing",
      "inTransit",
      "delivered",
    ]);
    expect(state.steps[1]?.status).toBe("current");
  });

  it("maps PAID_PENDING_SHIPMENT + PICKUP to preparing pickup", () => {
    const state = getOrderTrackingState({
      shipment: { method: "PICKUP" },
      status: OrderStatus.PAID_PENDING_SHIPMENT,
    });

    expect(state.labelKey).toBe("preparing");
    expect(state.fulfillmentKey).toBe("pickup");
    expect(state.steps.map((step) => step.key)).toEqual([
      "confirmed",
      "preparing",
      "readyForPickup",
      "delivered",
    ]);
    expect(state.steps[1]?.status).toBe("current");
  });

  it("maps SHIPPED + LOCAL_DELIVERY to in transit", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.SHIPPED,
    });

    expect(state.labelKey).toBe("inTransit");
    expect(state.primaryAction).toBe("track");
    expect(state.steps[2]?.key).toBe("inTransit");
    expect(state.steps[2]?.status).toBe("current");
  });

  it("maps SHIPPED + PICKUP to ready for pickup", () => {
    const state = getOrderTrackingState({
      shipment: { method: "PICKUP" },
      status: OrderStatus.SHIPPED,
    });

    expect(state.labelKey).toBe("readyForPickup");
    expect(state.primaryAction).toBe("detail");
    expect(state.steps[2]?.key).toBe("readyForPickup");
    expect(state.steps[2]?.status).toBe("current");
  });

  it("maps DELIVERED to completed steps", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.DELIVERED,
    });

    expect(state.labelKey).toBe("delivered");
    expect(state.steps.every((step) => step.status === "completed")).toBe(true);
  });

  it("maps CANCELLED to compact cancelled state", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.CANCELLED,
    });

    expect(state.labelKey).toBe("cancelled");
    expect(state.isCancelled).toBe(true);
    expect(state.currentStepIndex).toBe(-1);
    expect(state.secondaryAction).toBe("contact");
  });

  it("maps REFUNDED to compact refunded state", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.REFUNDED,
    });

    expect(state.labelKey).toBe("refunded");
    expect(state.isRefunded).toBe(true);
    expect(state.currentStepIndex).toBe(-1);
    expect(state.secondaryAction).toBe("contact");
  });

  // La garantía que hace útil el refactor: el módulo decide qué mostrar, y el
  // catálogo tiene cómo escribirlo. Sin esto, agregar un estado nuevo acá
  // dejaría la UI con un MISSING_MESSAGE en producción y ningún test en rojo.
  it("todo identificador que devuelve tiene texto en el catálogo", () => {
    const estados = [
      OrderStatus.PAYMENT_PROCESSING,
      OrderStatus.PAID_PENDING_SHIPMENT,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ];

    for (const method of ["PICKUP", "LOCAL_DELIVERY"]) {
      for (const status of estados) {
        const state = getOrderTrackingState({ shipment: { method }, status });

        expect(es.Orders.tracking, `falta tracking.${state.labelKey}`).toHaveProperty(
          state.labelKey,
        );
        expect(es.Orders.dateLabel, `falta dateLabel.${state.dateLabelKey}`).toHaveProperty(
          state.dateLabelKey,
        );
        expect(es.Orders.fulfillment).toHaveProperty(state.fulfillmentKey);
        expect(es.Orders.action).toHaveProperty(state.primaryAction);
        if (state.secondaryAction) {
          expect(es.Orders.action).toHaveProperty(state.secondaryAction);
        }
        for (const step of state.steps) {
          expect(es.Orders.step, `falta step.${step.key}`).toHaveProperty(step.key);
        }
      }
    }
  });
});
