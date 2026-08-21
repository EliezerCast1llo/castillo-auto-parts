import type { OrderStatus } from "@prisma/client";

export type TrackingStepStatus = "completed" | "current" | "upcoming";

/** Pasos posibles del seguimiento. La grafía del paso se resuelve al mostrarlo. */
export type OrderTrackingStepKey =
  | "confirmed"
  | "preparing"
  | "readyForPickup"
  | "inTransit"
  | "delivered";

export type OrderTrackingStep = {
  key: OrderTrackingStepKey;
  status: TrackingStepStatus;
};

/**
 * Estado del seguimiento, en identificadores.
 *
 * Este módulo devolvía el texto que se muestra —`label: "En camino"`, y el tipo
 * de `primaryAction` era literalmente `"Rastrear pedido" | "Ver detalle"`—, así
 * que traducirlo habría cambiado el **tipo**, no solo la vista. Peor: la `key`
 * de cada paso se derivaba de su etiqueta, o sea que el identificador cambiaba
 * de idioma junto con el texto.
 *
 * Ahora decide qué mostrar y no cómo se escribe. Las clases de color se quedan
 * porque son presentación, no texto.
 */
export type OrderTrackingState = {
  badgeClassName: string;
  currentStepIndex: number;
  dateLabelKey: "updatedAt" | "readyForPickup" | "estimatedDelivery" | "deliveredAt";
  dateValue?: Date | string | null;
  fulfillmentKey: "pickup" | "delivery";
  isCancelled: boolean;
  isRefunded: boolean;
  labelKey:
    | "cancelled"
    | "refunded"
    | "paymentProcessing"
    | "preparing"
    | "readyForPickup"
    | "inTransit"
    | "delivered";
  primaryAction: "track" | "detail";
  secondaryAction?: "contact" | "detail" | "reorder";
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
  const fulfillmentKey = isPickup ? "pickup" : "delivery";

  if (order.status === "CANCELLED") {
    return {
      badgeClassName: "border-red-200 bg-red-50 text-red-700",
      currentStepIndex: -1,
      dateLabelKey: "updatedAt",
      dateValue: order.updatedAt ?? order.createdAt ?? null,
      fulfillmentKey,
      isCancelled: true,
      isRefunded: false,
      labelKey: "cancelled",
      primaryAction: "detail",
      secondaryAction: "contact",
      steps,
      visualStatus: "cancelled",
    };
  }

  if (order.status === "REFUNDED") {
    return {
      badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
      currentStepIndex: -1,
      dateLabelKey: "updatedAt",
      dateValue: order.updatedAt ?? order.createdAt ?? null,
      fulfillmentKey,
      isCancelled: false,
      isRefunded: true,
      labelKey: "refunded",
      primaryAction: "detail",
      secondaryAction: "contact",
      steps,
      visualStatus: "refunded",
    };
  }

  if (order.status === "PAYMENT_PROCESSING") {
    return {
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      currentStepIndex: 0,
      dateLabelKey: isPickup ? "readyForPickup" : "estimatedDelivery",
      dateValue: order.shipment?.estimatedDeliveryAt ?? null,
      fulfillmentKey,
      isCancelled: false,
      isRefunded: false,
      labelKey: "paymentProcessing",
      primaryAction: "detail",
      secondaryAction: "contact",
      steps: applyCurrentStep(steps, 0),
      visualStatus: "payment_processing",
    };
  }

  if (order.status === "PAID_PENDING_SHIPMENT") {
    return {
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      currentStepIndex: 1,
      dateLabelKey: isPickup ? "readyForPickup" : "estimatedDelivery",
      dateValue: order.shipment?.estimatedDeliveryAt ?? null,
      fulfillmentKey,
      isCancelled: false,
      isRefunded: false,
      labelKey: "preparing",
      primaryAction: "detail",
      secondaryAction: "contact",
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
      dateLabelKey: isPickup ? "readyForPickup" : "estimatedDelivery",
      dateValue: order.shipment?.estimatedDeliveryAt ?? null,
      fulfillmentKey,
      isCancelled: false,
      isRefunded: false,
      labelKey: isPickup ? "readyForPickup" : "inTransit",
      primaryAction: isPickup ? "detail" : "track",
      secondaryAction: isPickup ? "contact" : "detail",
      steps: applyCurrentStep(steps, 2),
      visualStatus: isPickup ? "ready_for_pickup" : "in_transit",
    };
  }

  return {
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    currentStepIndex: 3,
    dateLabelKey: "deliveredAt",
    dateValue: order.shipment?.deliveredAt ?? order.updatedAt ?? null,
    fulfillmentKey,
    isCancelled: false,
    isRefunded: false,
    labelKey: "delivered",
    primaryAction: "detail",
    secondaryAction: "reorder",
    steps: steps.map((step) => ({ ...step, status: "completed" })),
    visualStatus: "delivered",
  };
}

function buildSteps(fulfillmentType: "delivery" | "pickup"): OrderTrackingStep[] {
  // Las claves se escriben, no se derivan de la etiqueta. Antes salían de
  // `label.toLowerCase()`, así que el identificador del paso cambiaba de idioma
  // junto con el texto que lo describe.
  const keys: OrderTrackingStepKey[] =
    fulfillmentType === "pickup"
      ? ["confirmed", "preparing", "readyForPickup", "delivered"]
      : ["confirmed", "preparing", "inTransit", "delivered"];

  return keys.map((key) => ({ key, status: "upcoming" }));
}

function applyCurrentStep(steps: OrderTrackingStep[], currentStepIndex: number): OrderTrackingStep[] {
  return steps.map((step, index) => {
    if (index < currentStepIndex) return { ...step, status: "completed" };
    if (index === currentStepIndex) return { ...step, status: "current" };
    return { ...step, status: "upcoming" };
  });
}
