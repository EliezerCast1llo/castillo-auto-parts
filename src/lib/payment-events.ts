import {
  OrderStatus,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from "@prisma/client";
import { db } from "./db";
import { sendOrderConfirmationEmail } from "./email/transactional";
import { buildAbsoluteAppUrl } from "./email/templates";
import { confirmInventoryReservation } from "./inventory-reservations";
import { logWarn } from "./logger";
import {
  buildOrderAccessHref,
  createOrderAccessToken,
  hashOrderAccessToken,
} from "./order-access-token";
import type { PaymentWebhookEvent } from "./payments";

export type ProcessPaymentEventResult =
  | { status: "already_processed" | "duplicate" | "manual_review" | "processed" }
  | { reason: string; status: "invalid" | "not_found" | "rejected" };

export async function processPaymentWebhookEvent(
  event: PaymentWebhookEvent,
  { expectedProduction }: { expectedProduction?: boolean } = {},
): Promise<ProcessPaymentEventResult> {
  const structuralError = validateEventStructure(event);
  if (structuralError) return { reason: structuralError, status: "invalid" };

  const payment = await db.payment.findFirst({
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalCents: true,
        },
      },
    },
    where: {
      OR: [
        { externalPaymentId: event.externalPaymentId },
        { order: { orderNumber: event.externalReference } },
      ],
      provider: event.provider,
    },
  });

  if (!payment) return { reason: "payment_not_found", status: "not_found" };

  const validationError = validateEventAgainstPayment(event, payment, expectedProduction);
  if (validationError) {
    logWarn({
      context: "paymentWebhookRejected",
      orderId: payment.order.id,
      reason: validationError,
    });
    return recordRejectedPaymentEvent(payment.id, event, validationError);
  }

  if (event.status !== "PAID") {
    return recordRejectedPaymentEvent(payment.id, event, "unsupported_payment_status");
  }

  const emailAccessToken = createOrderAccessToken();
  try {
    const result = await db.$transaction(async (tx) => {
      await tx.paymentEvent.create({
        data: {
          eventType: event.eventType,
          externalEventId: event.externalEventId,
          isValid: true,
          payloadJson: toJsonPayload(event.rawPayload),
          paymentId: payment.id,
          provider: event.provider,
        },
      });

      const currentPayment = await tx.payment.findUniqueOrThrow({
        include: {
          order: {
            include: {
              items: {
                select: {
                  productId: true,
                  quantity: true,
                },
              },
            },
          },
        },
        where: { id: payment.id },
      });

      if (
        currentPayment.status === PrismaPaymentStatus.PAID
      ) {
        return { status: "already_processed" as const };
      }

      if (currentPayment.order.status !== OrderStatus.PAYMENT_PROCESSING) {
        await tx.payment.update({
          data: {
            externalPaymentId: event.externalPaymentId,
            externalReference: event.externalReference,
            paidAt: event.occurredAt ?? new Date(),
            rawStatus: "PAID_AFTER_RESERVATION_RELEASED",
            status: PrismaPaymentStatus.PAID,
          },
          where: { id: currentPayment.id },
        });
        return { status: "manual_review" as const };
      }

      const paidAt = event.occurredAt ?? new Date();
      const orderClaim = await tx.order.updateMany({
        data: {
          emailAccessTokenHash: hashOrderAccessToken(emailAccessToken),
          paidAt,
          reservationExpiresAt: null,
          status: OrderStatus.PAID_PENDING_SHIPMENT,
        },
        where: {
          id: currentPayment.order.id,
          status: OrderStatus.PAYMENT_PROCESSING,
        },
      });
      if (orderClaim.count !== 1) {
        return { status: "already_processed" as const };
      }

      await confirmInventoryReservation(tx, currentPayment.order.items);
      await tx.payment.update({
        data: {
          externalPaymentId: event.externalPaymentId,
          externalReference: event.externalReference,
          paidAt,
          rawStatus: event.status,
          status: PrismaPaymentStatus.PAID,
        },
        where: { id: currentPayment.id },
      });
      await tx.shipment.updateMany({
        data: { status: "PENDING" },
        where: { orderId: currentPayment.order.id },
      });

      return {
        email: {
          customerEmail: currentPayment.order.customerEmail,
          customerName: currentPayment.order.customerName,
          orderNumber: currentPayment.order.orderNumber,
          orderUrl: buildAbsoluteAppUrl(
            buildOrderAccessHref(currentPayment.order.orderNumber, emailAccessToken),
          ),
          totalCents: currentPayment.order.totalCents,
        },
        status: "processed" as const,
      };
    });

    if (result.status === "processed") {
      await sendOrderConfirmationEmail(result.email);
    }
    if (result.status === "manual_review") {
      logWarn({
        context: "paidOrderRequiresManualReview",
        orderId: payment.order.id,
      });
    }
    return { status: result.status };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { status: "duplicate" };
    throw error;
  }
}

function validateEventStructure(event: PaymentWebhookEvent) {
  if (!event.isValid) return "invalid_payload";
  if (!event.externalEventId) return "missing_event_id";
  if (!event.externalPaymentId) return "missing_payment_id";
  if (!event.externalReference) return "missing_reference";
  if (event.amountCents === undefined) return "missing_amount";
  return undefined;
}

function validateEventAgainstPayment(
  event: PaymentWebhookEvent,
  payment: {
    amountCents: number;
    order: { orderNumber: string; totalCents: number };
  },
  expectedProduction: boolean | undefined,
) {
  if (event.externalReference !== payment.order.orderNumber) return "reference_mismatch";
  if (
    event.amountCents !== payment.amountCents ||
    event.amountCents !== payment.order.totalCents
  ) {
    return "amount_mismatch";
  }
  if (
    expectedProduction !== undefined &&
    event.isProduction !== expectedProduction
  ) {
    return "environment_mismatch";
  }
  return undefined;
}

async function recordRejectedPaymentEvent(
  paymentId: string,
  event: PaymentWebhookEvent,
  reason: string,
): Promise<ProcessPaymentEventResult> {
  try {
    await db.paymentEvent.create({
      data: {
        eventType: event.eventType,
        externalEventId: event.externalEventId,
        isValid: false,
        payloadJson: {
          payload: toJsonPayload(event.rawPayload),
          rejectionReason: reason,
        },
        paymentId,
        provider: event.provider,
      },
    });
    return { reason, status: "rejected" };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { status: "duplicate" };
    throw error;
  }
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toJsonPayload(value: unknown) {
  return (value ?? {}) as Prisma.InputJsonValue;
}
