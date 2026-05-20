import type { Prisma } from "@prisma/client";
import { db } from "../db";
import { getEmailProvider } from ".";
import {
  buildOrderConfirmationEmail,
  type OrderConfirmationEmailInput,
} from "./templates";

const ORDER_CONFIRMATION_TEMPLATE = "order_confirmation";

export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput) {
  const provider = getEmailProvider();
  const message = buildOrderConfirmationEmail(input);

  try {
    const result = await provider.sendEmail(message);

    await db.emailLog.create({
      data: {
        externalId: result.externalId,
        payloadJson: emailPayloadJson(message),
        provider: result.provider,
        recipient: message.to,
        sentAt: new Date(),
        status: result.status,
        subject: message.subject,
        template: ORDER_CONFIRMATION_TEMPLATE,
      },
    });
  } catch (error) {
    console.error(error);

    await logFailedEmail({
      error,
      message,
      provider: provider.name,
      template: ORDER_CONFIRMATION_TEMPLATE,
    });
  }
}

function emailPayloadJson(message: ReturnType<typeof buildOrderConfirmationEmail>) {
  return {
    from: message.from,
    subject: message.subject,
    text: message.text,
    to: message.to,
  } satisfies Prisma.InputJsonValue;
}

async function logFailedEmail({
  error,
  message,
  provider,
  template,
}: {
  error: unknown;
  message: ReturnType<typeof buildOrderConfirmationEmail>;
  provider: string;
  template: string;
}) {
  try {
    await db.emailLog.create({
      data: {
        errorMessage: error instanceof Error ? error.message : "Unknown email error",
        payloadJson: emailPayloadJson(message),
        provider,
        recipient: message.to,
        status: "FAILED",
        subject: message.subject,
        template,
      },
    });
  } catch (logError) {
    console.error(logError);
  }
}
