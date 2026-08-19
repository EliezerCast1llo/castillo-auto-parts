"use server";

import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { processPaymentWebhookEvent } from "@/lib/payment-events";
import { isMockPaymentAvailable } from "@/lib/payments/mock-access";

export async function confirmMockPayment(formData: FormData) {
  if (!isMockPaymentAvailable()) notFound();

  const externalPaymentId = stringValue(formData.get("externalPaymentId"));
  const returnTo = safeReturnUrl(stringValue(formData.get("returnTo")));
  if (!externalPaymentId || !returnTo) notFound();

  const payment = await db.payment.findFirst({
    include: { order: { select: { orderNumber: true } } },
    where: { externalPaymentId, provider: "mock" },
  });
  if (!payment) notFound();

  const result = await processPaymentWebhookEvent(
    {
      amountCents: payment.amountCents,
      eventType: "mock.payment.approved",
      externalEventId: `MOCK-EVENT-${randomUUID()}`,
      externalPaymentId,
      externalReference: payment.order.orderNumber,
      isProduction: false,
      isValid: true,
      occurredAt: new Date(),
      provider: "mock",
      rawPayload: { simulation: true },
      status: "PAID",
    },
    { expectedProduction: false },
  );
  if (result.status !== "processed" && result.status !== "already_processed") {
    throw new Error(`Mock payment could not be confirmed (${result.status}).`);
  }

  redirect(returnTo);
}

function safeReturnUrl(value: string | undefined) {
  if (!value) return undefined;
  const siteUrl = new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.APP_URL?.trim() ||
      "http://localhost:3000",
  );
  const returnUrl = new URL(value, siteUrl);
  if (returnUrl.origin !== siteUrl.origin || !returnUrl.pathname.startsWith("/orders/")) {
    return undefined;
  }
  return returnUrl.toString();
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
