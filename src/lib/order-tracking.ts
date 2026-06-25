import type { OrderStatus } from "@prisma/client";

export type TrackingStepStatus = "completed" | "current" | "upcoming";

export type OrderTrackingStep = {
  key: string;
  label: string;
  status: TrackingStepStatus;
};

export type OrderTrackingState = {
  badgeClassName: string;
  currentStepIndex: number;
  dateLabel: string;
  dateValue?: Date | string | null;
  fulfillmentLabel: string;
  isCancelled: boolean;
  isRefunded: boolean;
  label: string;
  primaryAction: "Rastrear pedido" | "Ver detalle";
  secondaryAction?: "Contactar asesor" | "Ver detalle" | "Volver a comprar";
  steps: OrderTrackingStep[];
  visualStatus:
    | "cancelled"
    | "delivered"
    | "in_transit"
    | "payment_processing"
    | "preparing"
    | "ready_for_pickup"
    | "refunded";
};

type OrderTrackingInput = {
  createdAt?: Date;
  paidAt?: Date | null;
  shipment?: {
    deliveredAt?: Date | null;
    estimatedDeliveryAt?: Date | null;
    method?: string | null;
  } | null;
  status: OrderStatus;
  updatedAt?: Date;
};

export function getOrderTrackingState(order: OrderTrackingInput): OrderTrackingState {
  const isPickup = order.shipment?.method === "PICKUP";
  const steps = buildSteps(isPickup ? "pickup" : "delivery");
  const fulfillmentLabel = isPickup ? "Retiro en tienda" : "Entrega a domicilio";

  if (order.status === "CANCELLED") {
    return {
      badgeClassName: "border-red-200 bg-red-50 text-red-700",
      currentStepIndex: -1,
      dateLabel: "Actualizado el",
      dateValue: order.updatedAt ?? order.createdAt ?? null,
      fulfillmentLabel,
      isCancelled: true,
      isRefunded: false,
      label: "Cancelado",
      primaryAction: "Ver detalle",
      secondaryAction: "Contactar asesor",
      steps,
      visualStatus: "cancelled",
    };
  }

  if (order.status === "REFUNDED") {
    return {
      badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
      currentStepIndex: -1,
      dateLabel: "Actualizado el",
      dateValue: order.updatedAt ?? order.createdAt ?? null,
      fulfillmentLabel,
      isCancelled: false,
      isRefunded: true,
      label: "Reembolsado",
      primaryAction: "Ver detalle",
      secondaryAction: "Contactar asesor",
      steps,
      visualStatus: "refunded",
    };
  }

  if (order.status === "PAYMENT_PROCESSING") {
    return {
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      currentStepIndex: 0,
      dateLabel: isPickup ? "Listo para retiro" : "Entrega estimada",
      dateValue: order.shipment?.estimatedDeliveryAt ?? null,
      fulfillmentLabel,
      isCancelled: false,
      isRefunded: false,
      label: "Procesando pago",
      primaryAction: "Ver detalle",
      secondaryAction: "Contactar asesor",
      steps: applyCurrentStep(steps, 0),
      visualStatus: "payment_processing",
    };
  }

  if (order.status === "PAID_PENDING_SHIPMENT") {
    return {
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      currentStepIndex: 1,
      dateLabel: isPickup ? "Listo para retiro" : "Entrega estimada",
      dateValue: order.shipment?.estimatedDeliveryAt ?? null,
      fulfillmentLabel,
      isCancelled: false,
      isRefunded: false,
      label: "Preparando pedido",
      primaryAction: "Ver detalle",
      secondaryAction: "Contactar asesor",
      steps: applyCurrentStep(steps, 1),
      visualStatus: "preparing",
    };
  }

  if (order.status === "SHIPPED") {
    return {
      badgeClassName: isPickup
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-blue-200 bg-blue-50 text-blue-700",
      currentStepIndex: 2,
      dateLabel: isPickup ? "Listo para retiro" : "Entrega estimada",
      dateValue: order.shipment?.estimatedDeliveryAt ?? null,
      fulfillmentLabel,
      isCancelled: false,
      isRefunded: false,
      label: isPickup ? "Listo para retiro" : "En camino",
      primaryAction: isPickup ? "Ver detalle" : "Rastrear pedido",
      secondaryAction: isPickup ? "Contactar asesor" : "Ver detalle",
      steps: applyCurrentStep(steps, 2),
      visualStatus: isPickup ? "ready_for_pickup" : "in_transit",
    };
  }

  return {
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    currentStepIndex: 3,
    dateLabel: "Entregado el",
    dateValue: order.shipment?.deliveredAt ?? order.updatedAt ?? null,
    fulfillmentLabel,
    isCancelled: false,
    isRefunded: false,
    label: "Entregado",
    primaryAction: "Ver detalle",
    secondaryAction: "Volver a comprar",
    steps: steps.map((step) => ({ ...step, status: "completed" })),
    visualStatus: "delivered",
  };
}

function buildSteps(fulfillmentType: "delivery" | "pickup"): OrderTrackingStep[] {
  const labels =
    fulfillmentType === "pickup"
      ? ["Confirmado", "Preparando", "Listo para retiro", "Entregado"]
      : ["Confirmado", "Preparando", "En camino", "Entregado"];

  return labels.map((label) => ({
    key: label.toLowerCase().replace(/\s+/g, "_"),
    label,
    status: "upcoming",
  }));
}

function applyCurrentStep(steps: OrderTrackingStep[], currentStepIndex: number): OrderTrackingStep[] {
  return steps.map((step, index) => {
    if (index < currentStepIndex) return { ...step, status: "completed" };
    if (index === currentStepIndex) return { ...step, status: "current" };
    return { ...step, status: "upcoming" };
  });
}
