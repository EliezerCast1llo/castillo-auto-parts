"use server";

import { InventoryStatus, OrderStatus, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { requireAdminAccess } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { DEFAULT_LOCATION_CODE } from "@/lib/fulfillment";

const allowedOrderStatuses: OrderStatus[] = [
  "PAID_PENDING_SHIPMENT",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

class AdminOrderStatusError extends Error {
  constructor(readonly code: "invalid_transition" | "not_found") {
    super(code);
  }
}

export async function updateAdminOrderStatus(formData: FormData) {
  const orderNumber = formString(formData, "orderNumber");
  const status = parseOrderStatus(formString(formData, "status"));

  await requireAdminAccess(orderNumber ? `/admin/orders/${orderNumber}` : "/admin/orders");

  if (!orderNumber || !status) {
    redirect(`/admin/orders/${orderNumber || ""}?estado=invalid`);
  }

  try {
    await db.$transaction(async (tx) => {
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
        existingOrder.status === "PAID_PENDING_SHIPMENT" && isTerminalOrderStatus(status);

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
    });
  } catch (error) {
    if (error instanceof AdminOrderStatusError) {
      redirect(`/admin/orders/${orderNumber}?estado=${error.code}`);
    }

    console.error(error);
    redirect(`/admin/orders/${orderNumber}?estado=db_unavailable`);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderNumber}`);
  redirect(`/admin/orders/${orderNumber}?estado=updated`);
}

function parseOrderStatus(status: string) {
  return allowedOrderStatuses.find((option) => option === status);
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
  return status === "CANCELLED" || status === "REFUNDED";
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
