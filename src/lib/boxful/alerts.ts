import "server-only";
import { createHash } from "node:crypto";
import { db } from "../db";
import { getEmailProvider, getTransactionalEmailFrom } from "../email";
import { logError } from "../logger";
import { boxfulConfig, boxfulError } from "./config";

export async function queueShippingAlert(orderNumber: string) {
  const order = await db.order.findUnique({ where: { orderNumber }, include: { shipment: true } });
  if (!order?.shipment || order.shipment.provider !== "boxful") return;
  const scope = boxfulConfig().scope;
  await db.shippingAlert.createMany({ data: {
    id: `shipment:${order.shipment.id}`, accountScope: scope, orderNumber, amountCents: order.shipment.quotedCents,
    code: "SHIPPING_RATE_UNAVAILABLE", groupKey: `${scope}:${Math.floor(Date.now() / 60_000)}`,
  }, skipDuplicates: true });
}
export async function checkBoxfulBalance() {
  if (process.env.SHIPPING_PROVIDER !== "boxful") return;
  const accountScope = boxfulConfig().scope;
  const threshold = Number(process.env.BOXFUL_LOW_BALANCE_ALERT_CENTS);
  if (!Number.isSafeInteger(threshold) || threshold < 0 || !process.env.BOXFUL_LOW_BALANCE_ALERT_CENTS) return;
  const sum = await db.boxfulBalanceEntry.aggregate({ where: { accountScope }, _sum: { amountCents: true } });
  const balance = sum._sum.amountCents ?? 0;
  if (balance >= threshold) return;
  const topup = await db.boxfulBalanceEntry.findFirst({ where: { accountScope, amountCents: { gt: 0 } }, orderBy: { createdAt: "desc" } });
  const id = `balance:${accountScope}:${topup?.id ?? "initial"}`;
  await db.shippingAlert.createMany({ data: { id, accountScope, amountCents: balance, code: "BOXFUL_LOW_BALANCE", groupKey: `${accountScope}:${Math.floor(Date.now() / 60_000)}` }, skipDuplicates: true });
}
export async function flushShippingAlerts() {
  if (process.env.SHIPPING_PROVIDER !== "boxful") return;
  const accountScope = boxfulConfig().scope;
  const groups = await db.shippingAlert.findMany({ where: { accountScope, OR: [{ emailSentAt: null }, { telegramSentAt: null }] }, distinct: ["groupKey"], take: 3 });
  for (const group of groups) {
    await db.shippingAlertLease.createMany({ data: { id: group.groupKey, lockedUntil: new Date(0) }, skipDuplicates: true });
    const claimed = await db.shippingAlertLease.updateMany({ where: { id: group.groupKey, lockedUntil: { lt: new Date() } }, data: { lockedUntil: new Date(Date.now() + 60_000) } });
    if (!claimed.count) continue;
    try {
      const rows = await db.shippingAlert.findMany({ where: { accountScope, groupKey: group.groupKey }, orderBy: { createdAt: "asc" } });
      for (const channel of ["email", "telegram"] as const) {
        const field = channel === "email" ? "emailSentAt" : "telegramSentAt";
        const bucketEnd = (Number(group.groupKey.split(":").at(-1)) + 1) * 60_000;
        const hasDelivered = rows.some((r) => r.emailSentAt || r.telegramSentAt);
        // First incident is urgent; subsequent orders in this minute coalesce
        // into the cron's summary. Retry partially delivered rows immediately.
        const pending = rows.filter((r) => !r[field] && (!hasDelivered || Date.now() >= bucketEnd || r.emailSentAt || r.telegramSentAt));
        if (!pending.length) continue;
        const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
        const lines = pending.map((r) => `${r.orderNumber || "Saldo estimado"}: ${r.code}; USD ${((r.amountCents ?? 0) / 100).toFixed(2)}${r.orderNumber ? `\n${new URL(`/admin/orders/${encodeURIComponent(r.orderNumber)}`, site).toString()}` : ""}`);
        const text = `Boxful: atención urgente (${pending.length})\n${lines.join("\n")}`;
        try {
          if (channel === "email") {
            const to = process.env.OPS_ALERT_EMAIL;
            if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw boxfulError("CONFIG_MISSING");
            await getEmailProvider().sendEmail({ to, from: getTransactionalEmailFrom(), subject: "Boxful: envío pendiente o saldo bajo", text, signal: AbortSignal.timeout(5000), idempotencyKey: createHash("sha256").update(pending.map((r) => r.id).sort().join(":" )).digest("hex"), html: `<pre>${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>` });
          } else {
            const token = process.env.TELEGRAM_BOT_TOKEN, chatId = process.env.TELEGRAM_CHAT_ID;
            if (!token || !chatId) throw boxfulError("CONFIG_MISSING");
            const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", signal: AbortSignal.timeout(5000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true }) });
            const data = await response.json();
            if (!response.ok || data.ok !== true) throw boxfulError("PROVIDER_UNAVAILABLE");
          }
          await db.shippingAlert.updateMany({ where: { id: { in: pending.map((r) => r.id) } }, data: { [field]: new Date() } });
        } catch { await logError({ context: "boxful_alert", outcome: "failed" }, boxfulError("PROVIDER_UNAVAILABLE")); }
      }
    } finally { await db.shippingAlertLease.update({ where: { id: group.groupKey }, data: { lockedUntil: new Date(0) } }); }
  }
}
export async function runBoxfulMaintenance() {
  if (process.env.SHIPPING_PROVIDER !== "boxful") return;
  try {
    const pending = await db.shipment.findMany({ where: { provider: "boxful", creationState: { in: ["PENDING", "UNKNOWN"] }, order: { status: "PAID_PENDING_SHIPMENT", payment: { status: "PAID" } } }, include: { order: { select: { orderNumber: true } } }, take: 3 });
    const { ensureBoxfulShipment } = await import("./shipments");
    for (const shipment of pending) await ensureBoxfulShipment(shipment.order.orderNumber);
    await checkBoxfulBalance(); await flushShippingAlerts();
  }
  catch { await logError({ context: "boxful_alert", outcome: "failed" }, boxfulError("PROVIDER_UNAVAILABLE")); }
}
