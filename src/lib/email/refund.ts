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
  return sendAuditedEmail({ from: getTransactionalEmailFrom(), to: order.customerEmail, subject: t("subject", { orderNumber }), text, html: `<p>${text}</p>`, idempotencyKey: `order-refund-${orderNumber}` }, "order_refund");
}
