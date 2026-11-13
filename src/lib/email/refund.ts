import { createTranslator } from "use-intl/core";
import { loadMessages } from "@/lib/i18n/messages";
import { db } from "@/lib/db";
import { getTransactionalEmailFrom } from ".";
import { sendAuditedEmail } from "./audited-delivery";

/** Called once after a committed transition, not on a repeated status submission. */
export async function sendRefundNotification(orderNumber: string) {
  const order = await db.order.findUniqueOrThrow({ where: { orderNumber }, select: { customerEmail: true, locale: true } });
  const locale = order.locale === "en" ? "en" : "es";
  const t = createTranslator({ locale, messages: loadMessages(locale), namespace: "Email.refund" });
  const text = t("body", { orderNumber });
  const notificationKey = `order-refund-${orderNumber}`;
  const sent = await db.emailLog.findFirst({ where: { template: "order_refund", status: "SENT", payloadJson: { path: ["notificationKey"], equals: notificationKey } }, select: { id: true } });
  if (sent) return true;

  // One retry only. A stable key protects against a provider accepting a
  // request whose response was lost; stop immediately on confirmed success.
  for (let attempt = 0; attempt < 2; attempt++) {
    const delivered = await sendAuditedEmail({ from: getTransactionalEmailFrom(), to: order.customerEmail, subject: t("subject", { orderNumber }), text, html: `<p>${text}</p>`, idempotencyKey: notificationKey, signal: AbortSignal.timeout(10_000) }, "order_refund");
    if (delivered) return true;
  }
  return false;
}
