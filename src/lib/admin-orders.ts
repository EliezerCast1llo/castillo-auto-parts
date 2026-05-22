import { InventoryStatus, OrderStatus, type Prisma } from "@prisma/client";
import { writeAdminAuditLog } from "./admin-audit";
import { DEFAULT_LOCATION_CODE } from "./fulfillment";

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

  if (isTerminalOrderStatus(existingOrder.status) && !isTerminalOrderStatus(status)) {
    throw new AdminOrderStatusError("invalid_transition");
  }

  const shouldRestoreStock =
    existingOrder.status === OrderStatus.PAID_PENDING_SHIPMENT && isTerminalOrderStatus(status);

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

function isTerminalOrderStatus(status: OrderStatus) {
  return status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED;
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
