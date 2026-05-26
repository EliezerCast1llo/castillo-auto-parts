import { InventoryStatus, OrderStatus, type Prisma } from "@prisma/client";
import { writeAdminAuditLog } from "./admin-audit";
import { DEFAULT_LOCATION_CODE } from "./fulfillment";

// ---------------------------------------------------------------------------
// Máquina de estados de orden
// ---------------------------------------------------------------------------

/**
 * Transiciones válidas por estado de origen.
 *
 * Define explícitamente qué estados puede alcanzar una orden desde su estado
 * actual. Las ordenes cerradas no pueden volver a estados operativos, pero
 * una cancelacion puede reconciliarse como reembolso sin restaurar inventario
 * por segunda vez.
 *
 * Diagrama:
 *   PAID_PENDING_SHIPMENT → SHIPPED | CANCELLED | REFUNDED
 *   SHIPPED               → DELIVERED | CANCELLED | REFUNDED
 *   DELIVERED             → (cerrada)
 *   CANCELLED             → REFUNDED
 *   REFUNDED              → (cerrada)
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  CANCELLED: [OrderStatus.REFUNDED],
  DELIVERED: [],
  PAID_PENDING_SHIPMENT: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  REFUNDED: [],
  SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
};

const terminalOrderStatuses = new Set<OrderStatus>([
  OrderStatus.CANCELLED,
  OrderStatus.DELIVERED,
  OrderStatus.REFUNDED,
]);

const stockRestoringOrderStatuses = new Set<OrderStatus>([
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
]);

/**
 * Lista plana de todos los estados que el admin puede asignar (al menos una
 * transición entrante). Útil para filtros y selectores de UI.
 */
export const allowedAdminOrderStatuses: OrderStatus[] = [
  OrderStatus.PAID_PENDING_SHIPMENT,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
];

export type AdminOrderStatusErrorCode = "invalid_transition" | "not_found";

export class AdminOrderStatusError extends Error {
  constructor(readonly code: AdminOrderStatusErrorCode) {
    super(code);
  }
}

export function parseAdminOrderStatus(status: string) {
  return allowedAdminOrderStatuses.find((option) => option === status);
}

/**
 * Verifica si una transición de estado es válida según ORDER_STATUS_TRANSITIONS.
 * Reemplaza la lógica implícita de isTerminalOrderStatus para transiciones.
 */
export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || (ORDER_STATUS_TRANSITIONS[from] as OrderStatus[]).includes(to);
}

/**
 * Retorna true si el estado esta cerrado para reapertura operativa.
 */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return terminalOrderStatuses.has(status);
}

export async function updateOrderStatusForAdmin(
  tx: Prisma.TransactionClient,
  {
    orderNumber,
    status,
  }: {
    orderNumber: string;
    status: OrderStatus;
  },
) {
  const existingOrder = await tx.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      items: {
        select: {
          productId: true,
          quantity: true,
        },
      },
      shipment: {
        select: { status: true },
      },
      status: true,
    },
  });

  if (!existingOrder) {
    throw new AdminOrderStatusError("not_found");
  }

  if (!canTransitionOrderStatus(existingOrder.status, status)) {
    throw new AdminOrderStatusError("invalid_transition");
  }

  const shouldRestoreStock =
    existingOrder.status === OrderStatus.PAID_PENDING_SHIPMENT &&
    stockRestoringOrderStatuses.has(status);

  if (shouldRestoreStock) {
    await restoreOrderStock(tx, existingOrder.items);
  }

  await tx.order.update({
    data: {
      shipment: {
        update: {
          status: mapShipmentStatus(status),
        },
      },
      status,
    },
    where: {
      orderNumber,
    },
  });

  await writeAdminAuditLog(tx, {
    action: "order.status_updated",
    entityId: existingOrder.id,
    entityLabel: orderNumber,
    entityType: "Order",
    metadata: {
      nextStatus: status,
      previousShipmentStatus: existingOrder.shipment?.status ?? null,
      previousStatus: existingOrder.status,
      stockRestored: shouldRestoreStock,
    },
  });

  return {
    nextStatus: status,
    previousStatus: existingOrder.status,
    stockRestored: shouldRestoreStock,
  };
}

function mapShipmentStatus(status: OrderStatus) {
  const statusMap: Record<OrderStatus, string> = {
    CANCELLED: "CANCELLED",
    DELIVERED: "DELIVERED",
    PAID_PENDING_SHIPMENT: "PENDING",
    REFUNDED: "CANCELLED",
    SHIPPED: "IN_TRANSIT",
  };

  return statusMap[status];
}

async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  items: Array<{ productId: string; quantity: number }>,
) {
  for (const item of items) {
    const stock = await tx.inventoryStock.findFirst({
      where: {
        location: { code: DEFAULT_LOCATION_CODE },
        productId: item.productId,
      },
      select: {
        id: true,
        quantityOnHand: true,
        quantityReserved: true,
        reorderPoint: true,
      },
    });

    if (!stock) continue;

    const nextQuantityOnHand = stock.quantityOnHand + item.quantity;
    const nextAvailableQuantity = Math.max(nextQuantityOnHand - stock.quantityReserved, 0);

    await tx.inventoryStock.update({
      data: {
        quantityOnHand: {
          increment: item.quantity,
        },
        status: getRestoredStockStatus(nextAvailableQuantity, stock.reorderPoint),
      },
      where: { id: stock.id },
    });
  }
}

function getRestoredStockStatus(availableQuantity: number, reorderPoint: number) {
  if (availableQuantity <= 0) return InventoryStatus.OUT_OF_STOCK;
  if (availableQuantity <= reorderPoint) return InventoryStatus.LOW_STOCK;
  return InventoryStatus.IN_STOCK;
}
