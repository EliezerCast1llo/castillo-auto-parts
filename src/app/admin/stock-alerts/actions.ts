"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { requireAdminRole } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { parseStockAlertStatus } from "@/lib/stock-alerts";

class StockAlertAdminError extends Error {
  constructor(readonly code: "not_found") {
    super(code);
  }
}

export async function updateStockAlertStatus(formData: FormData) {
  await requireAdminRole("ADMIN", "SUPPORT", "WAREHOUSE");

  const alertId = formString(formData, "alertId");
  const status = parseStockAlertStatus(formString(formData, "status"));

  if (!alertId || !status) {
    redirect("/admin/stock-alerts?estado=invalid");
  }

  try {
    await db.$transaction(async (tx) => {
      const existingAlert = await tx.stockAlertRequest.findUnique({
        where: { id: alertId },
      });

      if (!existingAlert) {
        throw new StockAlertAdminError("not_found");
      }

      const updatedAlert = await tx.stockAlertRequest.update({
        data: { status },
        where: { id: alertId },
      });

      await writeAdminAuditLog(tx, {
        action: "stock_alert.status_updated",
        entityId: updatedAlert.id,
        entityLabel: updatedAlert.skuSnapshot,
        entityType: "StockAlertRequest",
        metadata: {
          contact: {
            email: updatedAlert.email,
            phone: updatedAlert.phone,
          },
          nextStatus: status,
          previousStatus: existingAlert.status,
          requestedQuantity: updatedAlert.requestedQuantity,
        },
      });
    });
  } catch (error) {
    if (error instanceof StockAlertAdminError) {
      redirect(`/admin/stock-alerts?estado=${error.code}`);
    }

    console.error(error);
    redirect("/admin/stock-alerts?estado=db_unavailable");
  }

  revalidatePath("/admin/stock-alerts");
  redirect("/admin/stock-alerts?estado=updated");
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
