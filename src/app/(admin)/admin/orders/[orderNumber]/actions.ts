"use server";

import { sendRefundNotification } from "@/lib/email/refund";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AdminOrderStatusError,
  parseAdminOrderStatus,
  updateOrderStatusForAdmin,
} from "@/lib/admin-orders";
import { requireAdminRole } from "@/lib/admin-auth";
import { formString } from "@/lib/form-utils";
import { logInfo, observeOperation } from "@/lib/logger";
import { db } from "@/lib/db";

export async function updateAdminOrderStatus(formData: FormData) {
  const orderNumber = formString(formData, "orderNumber");
  const status = parseAdminOrderStatus(formString(formData, "status"));

  await requireAdminRole("ADMIN", "SALES", "WAREHOUSE", "SUPPORT", "ACCOUNTING");

  if (!orderNumber || !status) {
    redirect(`/admin/orders/${orderNumber || ""}?estado=invalid`);
  }

  try {
    await observeOperation("reconciliation", async () => {
      const transition = await db.$transaction(async (tx) => {
        return updateOrderStatusForAdmin(tx, { orderNumber, status });
      });
      if (transition?.nextStatus === "REFUNDED" && transition.previousStatus !== "REFUNDED") {
        await sendRefundNotification(orderNumber);
      }
      await logInfo({ context: "reconciliation", outcome: "completed" });
    }, undefined, { isExpectedError: (error) => error instanceof AdminOrderStatusError });
  } catch (error) {
    if (error instanceof AdminOrderStatusError) {
      redirect(`/admin/orders/${orderNumber}?estado=${error.code}`);
    }

    redirect(`/admin/orders/${orderNumber}?estado=db_unavailable`);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderNumber}`);
  redirect(`/admin/orders/${orderNumber}?estado=updated`);
}


export async function retryBoxfulShipment(formData: FormData) {
  await requireAdminRole("ADMIN", "WAREHOUSE");
  const orderNumber = formString(formData, "orderNumber");
  if (!/^CAP-[A-Z0-9-]+$/.test(orderNumber)) redirect("/admin/orders");
  const { ensureBoxfulShipment } = await import("@/lib/boxful/shipments");
  await ensureBoxfulShipment(orderNumber);
  revalidatePath(`/admin/orders/${orderNumber}`);
  redirect(`/admin/orders/${orderNumber}`);
}
