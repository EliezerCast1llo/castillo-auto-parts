"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminOrderStatusError,
  parseAdminOrderStatus,
  updateOrderStatusForAdmin,
} from "@/lib/admin-orders";
import { requireAdminAccess } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function updateAdminOrderStatus(formData: FormData) {
  const orderNumber = formString(formData, "orderNumber");
  const status = parseAdminOrderStatus(formString(formData, "status"));

  await requireAdminAccess(orderNumber ? `/admin/orders/${orderNumber}` : "/admin/orders");

  if (!orderNumber || !status) {
    redirect(`/admin/orders/${orderNumber || ""}?estado=invalid`);
  }

  try {
    await db.$transaction(async (tx) => {
      await updateOrderStatusForAdmin(tx, { orderNumber, status });
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

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
