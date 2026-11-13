import { db } from "@/lib/db";
import { getEmailProvider } from ".";
import type { EmailMessage } from "./provider";
import { localErrorCode } from "@/lib/monitoring-event";
import { logError } from "@/lib/logger";

export async function sendAuditedEmail(message: EmailMessage, template: string) {
  let provider = "unavailable";
  try {
    const sender = getEmailProvider();
    provider = sender.name;
    const result = await sender.sendEmail(message);
    await record({ ...result, sentAt: new Date() });
    return true;
  } catch (error) {
    await record({ provider, status: "FAILED", errorMessage: localErrorCode(error) });
    logError({ context: "sendAuditedEmail" }, error);
    return false;
  }

  async function record(result: { provider: string; status: string; externalId?: string; sentAt?: Date; errorMessage?: string }) {
    try {
      await db.emailLog.create({ data: { ...result, template, ...(template === "order_refund" && message.idempotencyKey ? { payloadJson: { notificationKey: message.idempotencyKey } } : {}), recipient: message.to, subject: template === "two_factor_code" ? "Two-factor authentication" : message.subject } });
    } catch (error) {
      logError({ context: "emailDeliveryAudit" }, error);
    }
  }
}
