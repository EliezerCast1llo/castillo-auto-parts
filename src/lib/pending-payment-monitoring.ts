import { db } from "./db";
import { logError, logWarn } from "./logger";
import { sentryEndpoint } from "./monitoring";

export const PENDING_PAYMENT_ALERT_MINUTES = 30;
/** Run before expiration so a stopped/late scheduler's backlog is visible. */
export async function checkPendingPaymentBacklog() {
  if (!sentryEndpoint()) return;
  try {
    const count = await db.order.count({ where: {
      status: "PAYMENT_PROCESSING",
      createdAt: { lt: new Date(Date.now() - PENDING_PAYMENT_ALERT_MINUTES * 60_000) },
    } });
    if (count > 0) await logWarn({ context: "reservation_cron", outcome: "pending_overdue" });
  } catch {
    await logError({ context: "reservation_cron", outcome: "failed" });
  }
}
