import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatOrderStatus,
  formatPaymentProvider,
  formatPaymentStatus,
  formatShipmentMethod,
  formatShipmentStatus,
  getOrderStatusClassName,
} from "./order-formatters";

describe("formatOrderStatus", () => {
  it("retorna label en español para cada estado", () => {
    expect(formatOrderStatus(OrderStatus.PAYMENT_PROCESSING)).toBe("Confirmando pago");
    expect(formatOrderStatus(OrderStatus.PAID_PENDING_SHIPMENT)).toBe("Pendiente de entrega");
    expect(formatOrderStatus(OrderStatus.SHIPPED)).toBe("Enviada");
    expect(formatOrderStatus(OrderStatus.DELIVERED)).toBe("Entregada");
    expect(formatOrderStatus(OrderStatus.CANCELLED)).toBe("Cancelada");
    expect(formatOrderStatus(OrderStatus.REFUNDED)).toBe("Reembolsada");
  });
});

describe("getOrderStatusClassName", () => {
  it("retorna clase primaria para pago en confirmación", () => {
    expect(getOrderStatusClassName(OrderStatus.PAYMENT_PROCESSING)).toContain("primary");
  });

  it("retorna clase warning para pendiente de entrega", () => {
    expect(getOrderStatusClassName(OrderStatus.PAID_PENDING_SHIPMENT)).toContain("warning");
  });

  it("retorna clase success para entregada", () => {
    expect(getOrderStatusClassName(OrderStatus.DELIVERED)).toContain("success");
  });

  it("retorna clase danger para cancelada y reembolsada", () => {
    expect(getOrderStatusClassName(OrderStatus.CANCELLED)).toContain("danger");
    expect(getOrderStatusClassName(OrderStatus.REFUNDED)).toContain("danger");
  });
});

describe("formatShipmentMethod", () => {
  it("formatea métodos conocidos", () => {
    expect(formatShipmentMethod("PICKUP")).toBe("Retiro en bodega");
    expect(formatShipmentMethod("LOCAL_DELIVERY")).toBe("Envío local");
  });

  it("retorna Pendiente para método desconocido o undefined", () => {
    expect(formatShipmentMethod(undefined)).toBe("Pendiente");
    expect(formatShipmentMethod("UNKNOWN")).toBe("Pendiente");
  });
});

describe("formatShipmentStatus", () => {
  it("formatea estados conocidos", () => {
    expect(formatShipmentStatus("PENDING")).toBe("Pendiente");
    expect(formatShipmentStatus("IN_TRANSIT")).toBe("En tránsito");
    expect(formatShipmentStatus("DELIVERED")).toBe("Entregado");
    expect(formatShipmentStatus("CANCELLED")).toBe("Cancelado");
  });

  it("retorna Pendiente para undefined", () => {
    expect(formatShipmentStatus(undefined)).toBe("Pendiente");
  });
});

describe("formatPaymentProvider", () => {
  it("formatea proveedores conocidos", () => {
    expect(formatPaymentProvider("mock")).toBe("Pago mock");
    expect(formatPaymentProvider("wompi")).toBe("Wompi");
    expect(formatPaymentProvider("pagadito")).toBe("Pagadito");
    expect(formatPaymentProvider("bac_manual")).toBe("BAC manual");
  });

  it("retorna Pendiente para proveedor desconocido o undefined", () => {
    expect(formatPaymentProvider(undefined)).toBe("Pendiente");
    expect(formatPaymentProvider("stripe")).toBe("Pendiente");
  });
});

describe("formatPaymentStatus", () => {
  it("formatea estados conocidos", () => {
    expect(formatPaymentStatus("PAID")).toBe("Pagado");
    expect(formatPaymentStatus("PENDING")).toBe("Pendiente");
    expect(formatPaymentStatus("FAILED")).toBe("Fallido");
    expect(formatPaymentStatus("CANCELLED")).toBe("Cancelado");
    expect(formatPaymentStatus("REFUNDED")).toBe("Reembolsado");
  });

  it("retorna Pendiente para undefined", () => {
    expect(formatPaymentStatus(undefined)).toBe("Pendiente");
  });
});

describe("formatDateTime", () => {
  it("formatea una fecha en zona horaria de El Salvador", () => {
    const date = new Date("2026-05-26T15:30:00Z");
    const result = formatDateTime(date);
    // Verificamos que contiene el año y hora, sin fijar el formato exacto
    expect(result).toContain("2026");
    expect(result).toMatch(/\d+:\d+/);
  });
});
