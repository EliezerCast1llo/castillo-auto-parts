"use server";

import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const allowedOrderStatuses: OrderStatus[] = [
  "PAID_PENDING_SHIPMENT",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export async function updateAdminOrderStatus(formData: FormData) {
  const orderNumber = formString(formData, "orderNumber");
  const status = parseOrderStatus(formString(formData, "status"));

  if (!orderNumber || !status) {
    redirect(`/admin/orders/${orderNumber || ""}?estado=invalid`);
  }

  await db.order.update({
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
