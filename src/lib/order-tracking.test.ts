import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getOrderTrackingState } from "./order-tracking";

describe("getOrderTrackingState", () => {
  it("maps PAID_PENDING_SHIPMENT + LOCAL_DELIVERY to preparing delivery", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.PAID_PENDING_SHIPMENT,
    });

    expect(state.label).toBe("Preparando pedido");
    expect(state.fulfillmentLabel).toBe("Entrega a domicilio");
    expect(state.steps.map((step) => step.label)).toEqual([
      "Confirmado",
      "Preparando",
      "En camino",
      "Entregado",
    ]);
    expect(state.steps[1]?.status).toBe("current");
  });

  it("maps PAID_PENDING_SHIPMENT + PICKUP to preparing pickup", () => {
    const state = getOrderTrackingState({
      shipment: { method: "PICKUP" },
      status: OrderStatus.PAID_PENDING_SHIPMENT,
    });

    expect(state.label).toBe("Preparando pedido");
    expect(state.fulfillmentLabel).toBe("Retiro en tienda");
    expect(state.steps.map((step) => step.label)).toEqual([
      "Confirmado",
      "Preparando",
      "Listo para retiro",
      "Entregado",
    ]);
    expect(state.steps[1]?.status).toBe("current");
  });

  it("maps SHIPPED + LOCAL_DELIVERY to in transit", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.SHIPPED,
    });

    expect(state.label).toBe("En camino");
    expect(state.primaryAction).toBe("Rastrear pedido");
    expect(state.steps[2]?.label).toBe("En camino");
    expect(state.steps[2]?.status).toBe("current");
  });

  it("maps SHIPPED + PICKUP to ready for pickup", () => {
    const state = getOrderTrackingState({
      shipment: { method: "PICKUP" },
      status: OrderStatus.SHIPPED,
    });

    expect(state.label).toBe("Listo para retiro");
    expect(state.primaryAction).toBe("Ver detalle");
    expect(state.steps[2]?.label).toBe("Listo para retiro");
    expect(state.steps[2]?.status).toBe("current");
  });

  it("maps DELIVERED to completed steps", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.DELIVERED,
    });

    expect(state.label).toBe("Entregado");
    expect(state.steps.every((step) => step.status === "completed")).toBe(true);
  });

  it("maps CANCELLED to compact cancelled state", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.CANCELLED,
    });

    expect(state.label).toBe("Cancelado");
    expect(state.isCancelled).toBe(true);
    expect(state.currentStepIndex).toBe(-1);
    expect(state.secondaryAction).toBe("Contactar asesor");
  });

  it("maps REFUNDED to compact refunded state", () => {
    const state = getOrderTrackingState({
      shipment: { method: "LOCAL_DELIVERY" },
      status: OrderStatus.REFUNDED,
    });

    expect(state.label).toBe("Reembolsado");
    expect(state.isRefunded).toBe(true);
    expect(state.currentStepIndex).toBe(-1);
    expect(state.secondaryAction).toBe("Contactar asesor");
  });
});
