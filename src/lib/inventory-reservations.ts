import { InventoryStatus, type Prisma } from "@prisma/client";
import { DEFAULT_LOCATION_CODE } from "./fulfillment";

export type StockReservationRequest = {
  currentQuantityOnHand: number;
  currentQuantityReserved: number;
  quantity: number;
  reorderPoint: number;
  stockId: string;
};

export type ReservedOrderItem = {
  productId: string;
  quantity: number;
};

export class InventoryReservationError extends Error {
  constructor(readonly code: "insufficient_stock" | "reservation_inconsistent") {
    super(code);
  }
}

export async function reserveInventory(
  tx: Prisma.TransactionClient,
  requests: StockReservationRequest[],
) {
  const orderedRequests = [...requests].sort((left, right) =>
    left.stockId.localeCompare(right.stockId),
  );

  for (const request of orderedRequests) {
    const nextReserved = request.currentQuantityReserved + request.quantity;
    const nextAvailable = request.currentQuantityOnHand - nextReserved;
    const update = await tx.inventoryStock.updateMany({
      data: {
        quantityReserved: { increment: request.quantity },
        status: getInventoryStatus(nextAvailable, request.reorderPoint),
      },
      where: {
        id: request.stockId,
        quantityOnHand: request.currentQuantityOnHand,
        quantityReserved: request.currentQuantityReserved,
        status: { notIn: [InventoryStatus.OUT_OF_STOCK, InventoryStatus.PREORDER] },
      },
    });

    if (update.count !== 1) {
      throw new InventoryReservationError("insufficient_stock");
    }
  }
}

export async function confirmInventoryReservation(
  tx: Prisma.TransactionClient,
  items: ReservedOrderItem[],
) {
  for (const item of orderItems(items)) {
    const stock = await findDefaultStock(tx, item.productId);
    if (
      !stock ||
      stock.quantityOnHand < item.quantity ||
      stock.quantityReserved < item.quantity
    ) {
      throw new InventoryReservationError("reservation_inconsistent");
    }

    const nextQuantityOnHand = stock.quantityOnHand - item.quantity;
    const nextQuantityReserved = stock.quantityReserved - item.quantity;
    const update = await tx.inventoryStock.updateMany({
      data: {
        quantityOnHand: { decrement: item.quantity },
        quantityReserved: { decrement: item.quantity },
        status: getInventoryStatus(
          nextQuantityOnHand - nextQuantityReserved,
          stock.reorderPoint,
        ),
      },
      where: {
        id: stock.id,
        quantityOnHand: stock.quantityOnHand,
        quantityReserved: stock.quantityReserved,
      },
    });

    if (update.count !== 1) {
      throw new InventoryReservationError("reservation_inconsistent");
    }
  }
}

export async function releaseInventoryReservation(
  tx: Prisma.TransactionClient,
  items: ReservedOrderItem[],
) {
  for (const item of orderItems(items)) {
    const stock = await findDefaultStock(tx, item.productId);
    if (!stock || stock.quantityReserved < item.quantity) {
      throw new InventoryReservationError("reservation_inconsistent");
    }

    const nextQuantityReserved = stock.quantityReserved - item.quantity;
    const update = await tx.inventoryStock.updateMany({
      data: {
        quantityReserved: { decrement: item.quantity },
        status: getInventoryStatus(
          stock.quantityOnHand - nextQuantityReserved,
          stock.reorderPoint,
        ),
      },
      where: {
        id: stock.id,
        quantityOnHand: stock.quantityOnHand,
        quantityReserved: stock.quantityReserved,
      },
    });

    if (update.count !== 1) {
      throw new InventoryReservationError("reservation_inconsistent");
    }
  }
}

function orderItems(items: ReservedOrderItem[]) {
  return [...items].sort((left, right) => left.productId.localeCompare(right.productId));
}

function findDefaultStock(tx: Prisma.TransactionClient, productId: string) {
  return tx.inventoryStock.findFirst({
    select: {
      id: true,
      quantityOnHand: true,
      quantityReserved: true,
      reorderPoint: true,
    },
    where: {
      location: { code: DEFAULT_LOCATION_CODE },
      productId,
    },
  });
}

export function getInventoryStatus(availableQuantity: number, reorderPoint: number) {
  if (availableQuantity <= 0) return InventoryStatus.OUT_OF_STOCK;
  if (availableQuantity <= reorderPoint) return InventoryStatus.LOW_STOCK;
  return InventoryStatus.IN_STOCK;
}
