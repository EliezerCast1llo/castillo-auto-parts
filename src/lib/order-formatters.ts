/**
 * Formateadores de dominio para órdenes, envíos y pagos.
 *
 * Módulo centralizado que reemplaza las funciones duplicadas que existían en:
 *   - src/app/admin/orders/page.tsx
 *   - src/app/admin/orders/[orderNumber]/page.tsx
 *   - src/app/orders/[orderNumber]/page.tsx
 *
 * Todos los labels están en español salvadoreño (es-SV).
 */

import type { OrderStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Estado de orden
// ---------------------------------------------------------------------------

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CANCELLED: "Cancelada",
  DELIVERED: "Entregada",
  PAYMENT_PROCESSING: "Confirmando pago",
  PAID_PENDING_SHIPMENT: "Pendiente de entrega",
  REFUNDED: "Reembolsada",
  SHIPPED: "Enviada",
};

export function formatOrderStatus(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

/**
 * Clases de color Tailwind para el badge de estado de orden.
 * Usa tokens del design system (warning, success, danger, primary).
 */
export function getOrderStatusClassName(status: OrderStatus): string {
  if (status === "PAYMENT_PROCESSING") return "bg-primary/10 text-primary";
  if (status === "PAID_PENDING_SHIPMENT") return "bg-warning/15 text-warning";
  if (status === "SHIPPED") return "bg-primary/10 text-primary";
  if (status === "DELIVERED") return "bg-success/10 text-success";
  if (status === "CANCELLED" || status === "REFUNDED") return "bg-danger/10 text-danger";
  return "bg-muted text-muted-foreground";
}

// ---------------------------------------------------------------------------
// Método y estado de envío
// ---------------------------------------------------------------------------

/**
 * Formatea el método de fulfillment para mostrar al cliente y admin.
 * Compartido entre la vista pública de orden y el panel admin.
 */
export function formatShipmentMethod(method: string | undefined): string {
  if (method === "PICKUP") return "Retiro en bodega";
  if (method === "LOCAL_DELIVERY") return "Envío local";
  return "Pendiente";
}

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelado",
  DELIVERED: "Entregado",
  IN_TRANSIT: "En tránsito",
  PENDING: "Pendiente",
};

export function formatShipmentStatus(status: string | undefined): string {
  if (!status) return "Pendiente";
  return SHIPMENT_STATUS_LABELS[status] ?? status;
}

// ---------------------------------------------------------------------------
// Proveedor y estado de pago
// ---------------------------------------------------------------------------

/**
 * Formatea el nombre legible del proveedor de pago.
 * Agregar nuevos proveedores aquí cuando se integren.
 */
export function formatPaymentProvider(provider: string | undefined): string {
  if (provider === "mock") return "Pago mock";
  if (provider === "wompi") return "Wompi";
  if (provider === "pagadito") return "Pagadito";
  if (provider === "bac_manual") return "BAC manual";
  return "Pendiente";
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelado",
  FAILED: "Fallido",
  PAID: "Pagado",
  PENDING: "Pendiente",
  REFUNDED: "Reembolsado",
};

export function formatPaymentStatus(status: string | undefined): string {
  if (!status) return "Pendiente";
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

// ---------------------------------------------------------------------------
// Fecha y hora
// ---------------------------------------------------------------------------

/**
 * Formatea una fecha en zona horaria de El Salvador (America/El_Salvador).
 * Formato: "26 may 2026, 10:30 a. m."
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(date);
}
