import { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "./db";
import { releaseInventoryReservation } from "./inventory-reservations";

type CancelPaymentProcessingOrderInput = {
  expiresBefore?: Date;
  orderNumber: string;
  paymentStatus: typeof PaymentStatus.CANCELLED | typeof PaymentStatus.FAILED;
  rawStatus: string;
};

export async function cancelPaymentProcessingOrder({
  expiresBefore,
  orderNumber,
  paymentStatus,
  rawStatus,
}: CancelPaymentProcessingOrderInput) {
  return db.$transaction(async (tx) => {
    const claim = await tx.order.updateMany({
      data: {
        reservationExpiresAt: null,
        status: OrderStatus.CANCELLED,
      },
      where: {
        orderNumber,
        reservationExpiresAt: expiresBefore ? { lte: expiresBefore } : undefined,
        status: OrderStatus.PAYMENT_PROCESSING,
      },
    });

    if (claim.count !== 1) return false;

    const order = await tx.order.findUniqueOrThrow({
      select: {
        id: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
        payment: {
          select: {
            id: true,
            provider: true,
          },
        },
      },
      where: { orderNumber },
    });

    await releaseInventoryReservation(tx, order.items);
    await tx.shipment.updateMany({
      data: { status: "CANCELLED" },
      where: { orderId: order.id },
    });

    if (order.payment) {
      await tx.payment.update({
        data: {
          rawStatus,
          status: paymentStatus,
        },
        where: { id: order.payment.id },
      });
      await tx.paymentEvent.create({
        data: {
          eventType: "payment.reservation_released",
          isValid: true,
          payloadJson: { rawStatus },
          paymentId: order.payment.id,
          provider: order.payment.provider,
        },
      });
    }

    return true;
  });
}

export async function expirePaymentReservations({
  limit = 50,
  now = new Date(),
  orderNumber,
}: {
  limit?: number;
  now?: Date;
  orderNumber?: string;
} = {}) {
  const expiredOrders = await db.order.findMany({
    orderBy: { reservationExpiresAt: "asc" },
    select: { orderNumber: true },
    take: limit,
    where: {
      orderNumber,
      reservationExpiresAt: { lte: now },
      status: OrderStatus.PAYMENT_PROCESSING,
    },
  });

  let released = 0;
  for (const order of expiredOrders) {
    const didRelease = await cancelPaymentProcessingOrder({
      expiresBefore: now,
      orderNumber: order.orderNumber,
      paymentStatus: PaymentStatus.CANCELLED,
      rawStatus: "RESERVATION_EXPIRED",
    });
    if (didRelease) released += 1;
  }

  return released;
}
