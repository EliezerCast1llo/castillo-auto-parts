import {
  InventoryStatus,
  OrderStatus,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from "@prisma/client";
import { clearGuestCart, getGuestCart } from "./cart";
import { logError } from "./logger";
import {
  buildFormattedAddress,
  buildOrderNumber,
  calculateIncludedTaxCents,
  calculateOrderTaxCents,
  getFulfillmentLabel,
  parseCheckoutFormData,
  type CheckoutInput,
} from "./checkout";
import { db } from "./db";
import {
  DEFAULT_LOCATION_CODE,
  getActiveDeliveryZones,
  getDeliveryZoneBySlug,
  isCoordinateInsideDeliveryZone,
  type DeliveryZoneOption,
} from "./fulfillment";
import { buildAbsoluteAppUrl } from "./email/templates";
import {
  InventoryReservationError,
  reserveInventory,
} from "./inventory-reservations";
import { buildOrderAccessHref, createOrderAccessToken, hashOrderAccessToken } from "./order-access-token";
import { cancelPaymentProcessingOrder } from "./payment-reservations";
import {
  getPaymentProvider,
  type CreatePaymentResult,
  type PaymentProvider,
  type PaymentStatus,
} from "./payments";

export type CreateGuestOrderResult =
  | { accessToken: string; checkoutUrl: string; orderNumber: string; status: "created" }
  | {
      status:
        | "coverage_unavailable"
        | "db_unavailable"
        | "empty_cart"
        | "invalid"
        | "payment_unavailable"
        | "stock_issue";
    };

class CheckoutDomainError extends Error {
  constructor(readonly code: Exclude<CreateGuestOrderResult["status"], "created">) {
    super(code);
  }
}

const PAYMENT_RESERVATION_TTL_MS = 20 * 60 * 1000;

export async function createGuestCheckoutFromCart(
  formData: FormData,
  userId?: string,
  idempotencyKey?: string,
): Promise<CreateGuestOrderResult> {
  const parsed = parseCheckoutFormData(formData);
  if (!parsed.success) return { status: "invalid" };

  const cart = await getGuestCart();
  if (cart.lines.length === 0) return { status: "empty_cart" };
  if (cart.hasBlockingIssues) return { status: "stock_issue" };

  // Idempotencia: si este submit ya creó una orden viva (mismo hidden key),
  // devolver su checkout en vez de crear otra orden + otra reserva de stock.
  let effectiveIdempotencyKey = idempotencyKey;
  if (idempotencyKey) {
    const existing = await findOrderByIdempotencyKey(idempotencyKey);
    if (existing) {
      const replay = replayResultForOrder(existing);
      if (replay) return replay;
      // Orden previa muerta (expirada/cancelada/fallida): no se puede reusar la
      // key (@unique). Se crea una orden nueva sin key para evitar colisión.
      effectiveIdempotencyKey = undefined;
    }
  }

  try {
    const deliveryZones = await getActiveDeliveryZones();
    const deliveryZone = resolveCheckoutDeliveryZone(parsed.data, deliveryZones);
    if (parsed.data.fulfillmentMethod === "LOCAL_DELIVERY" && !deliveryZone) {
      return { status: "coverage_unavailable" };
    }
    if (
      deliveryZone &&
      !isCoordinateInsideDeliveryZone({
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        zone: deliveryZone,
      })
    ) {
      return { status: "coverage_unavailable" };
    }

    const shippingCents = getCheckoutShippingCents(parsed.data, deliveryZone);

    const paymentProvider = getPaymentProvider();
    const order = await db.$transaction(async (tx) => {
      const dbProducts = await tx.product.findMany({
        where: {
          sku: { in: cart.lines.map((line) => line.product.sku) },
          isActive: true,
        },
        include: {
          inventoryStocks: {
            take: 1,
            where: {
              location: {
                code: DEFAULT_LOCATION_CODE,
              },
            },
          },
        },
      });
      const productBySku = new Map(dbProducts.map((product) => [product.sku, product]));
      const preparedLines = cart.lines.map((line) => {
        const product = productBySku.get(line.product.sku);
        if (!product) throw new CheckoutDomainError("stock_issue");

        const stock = product.inventoryStocks[0];
        const availableQuantity = stock
          ? Math.max(stock.quantityOnHand - stock.quantityReserved, 0)
          : 0;

        if (isUnavailable(stock?.status) || availableQuantity < line.quantity) {
          throw new CheckoutDomainError("stock_issue");
        }

        const lineTotalCents = product.priceCents * line.quantity;
        return {
          orderItem: {
            brandSnapshot: product.brand,
            lineTotalCents,
            partNumberSnapshot: product.partNumber,
            productId: product.id,
            productNameSnapshot: product.name,
            quantity: line.quantity,
            skuSnapshot: product.sku,
            taxCents: calculateIncludedTaxCents(lineTotalCents),
            unitPriceCents: product.priceCents,
          },
          reservation: {
            currentQuantityOnHand: stock.quantityOnHand,
            currentQuantityReserved: stock.quantityReserved,
            quantity: line.quantity,
            reorderPoint: stock.reorderPoint,
            stockId: stock.id,
          },
        };
      });

      try {
        await reserveInventory(
          tx,
          preparedLines.map((line) => line.reservation),
        );
      } catch (error) {
        if (error instanceof InventoryReservationError) {
          throw new CheckoutDomainError("stock_issue");
        }
        throw error;
      }

      const orderLines = preparedLines.map((line) => line.orderItem);
      const subtotalCents = orderLines.reduce((total, line) => total + line.lineTotalCents, 0);
      const totalCents = subtotalCents + shippingCents;
      const taxCents = calculateOrderTaxCents({
        itemTaxCents: orderLines.map((line) => line.taxCents),
        shippingCents,
      });
      const addressId = await createDeliveryAddress(tx, parsed.data, deliveryZone);
      const orderNumber = buildOrderNumber();
      const accessToken = createOrderAccessToken();
      const savedOrder = await tx.order.create({
        data: {
          accessTokenHash: hashOrderAccessToken(accessToken),
          addressId,
          currency: "USD",
          idempotencyKey: effectiveIdempotencyKey ?? null,
          userId: userId ?? null,
          customerEmail: parsed.data.customerEmail,
          customerName: parsed.data.customerName,
          customerPhone: parsed.data.customerPhone,
          items: {
            create: orderLines,
          },
          notes: buildOrderNotes(parsed.data),
          orderNumber,
          shipment: {
            create: {
              deliveryZone:
                parsed.data.fulfillmentMethod === "LOCAL_DELIVERY"
                  ? getDeliveryZoneName(deliveryZone)
                  : "Bodega principal",
              method: parsed.data.fulfillmentMethod,
              notes: parsed.data.deliveryNotes,
            },
          },
          payment: {
            create: {
              amountCents: totalCents,
              currency: "USD",
              provider: paymentProvider.id,
              status: PrismaPaymentStatus.PENDING,
            },
          },
          reservationExpiresAt: new Date(Date.now() + PAYMENT_RESERVATION_TTL_MS),
          shippingCents,
          status: OrderStatus.PAYMENT_PROCESSING,
          subtotalCents,
          taxCents,
          totalCents,
        },
        select: {
          id: true,
          orderNumber: true,
          payment: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!savedOrder.payment) throw new CheckoutDomainError("db_unavailable");

      return {
        accessToken,
        customerEmail: parsed.data.customerEmail,
        orderNumber: savedOrder.orderNumber,
        paymentId: savedOrder.payment.id,
        totalCents,
      };
    });

    let payment: CreatePaymentResult;
    try {
      payment = await createPayment(paymentProvider, {
        amountCents: order.totalCents,
        customerEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        redirectUrl: buildAbsoluteAppUrl(
          buildOrderAccessHref(order.orderNumber, order.accessToken),
        ),
      });
    } catch {
      await cancelPendingOrderAfterPaymentFailure(order.orderNumber);
      return { status: "payment_unavailable" };
    }

    if (payment.status !== "PENDING") {
      await cancelPendingOrderAfterPaymentFailure(order.orderNumber);
      return { status: "payment_unavailable" };
    }

    await recordCreatedPayment(order.paymentId, payment);

    try {
      await clearGuestCart();
    } catch (error) {
      logError({ context: "clearGuestCartAfterPendingOrder" }, error);
    }

    return {
      accessToken: order.accessToken,
      checkoutUrl: payment.checkoutUrl,
      orderNumber: order.orderNumber,
      status: "created",
    };
  } catch (error) {
    if (error instanceof CheckoutDomainError) {
      return { status: error.code };
    }

    // Carrera concurrente: dos submits en paralelo con la misma key. El ganador
    // creó la orden; el @unique rechaza al perdedor con P2002. Devolver el
    // checkout del ganador si ya está listo; si no, pedir reintento.
    if (
      idempotencyKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await findOrderByIdempotencyKey(idempotencyKey);
      const replay = existing ? replayResultForOrder(existing) : null;
      if (replay) return replay;
      return { status: "payment_unavailable" };
    }

    logError({ context: "createGuestCheckoutFromCart" }, error);
    return { status: "db_unavailable" };
  }
}

export type IdempotentOrderLookup = {
  orderNumber: string;
  status: OrderStatus;
  reservationExpiresAt: Date | null;
  payment: { checkoutUrl: string | null } | null;
};

function findOrderByIdempotencyKey(idempotencyKey: string): Promise<IdempotentOrderLookup | null> {
  return db.order.findUnique({
    where: { idempotencyKey },
    select: {
      orderNumber: true,
      status: true,
      reservationExpiresAt: true,
      payment: { select: { checkoutUrl: true } },
    },
  });
}

// Devuelve el resultado "created" reutilizable solo si la orden previa sigue viva
// (en proceso de pago, reserva no expirada) y ya tiene checkout listo.
export function replayResultForOrder(order: IdempotentOrderLookup): CreateGuestOrderResult | null {
  const isActive =
    order.status === OrderStatus.PAYMENT_PROCESSING &&
    order.reservationExpiresAt !== null &&
    order.reservationExpiresAt.getTime() > Date.now();

  if (!isActive || !order.payment?.checkoutUrl) return null;

  // accessToken solo se usa en el primer submit para armar el redirect del proveedor;
  // en un replay el checkoutUrl ya está persistido, así que no se necesita el token.
  return {
    accessToken: "",
    checkoutUrl: order.payment.checkoutUrl,
    orderNumber: order.orderNumber,
    status: "created",
  };
}

async function recordCreatedPayment(paymentId: string, payment: CreatePaymentResult) {
  await db.$transaction([
    db.payment.update({
      data: {
        checkoutUrl: payment.checkoutUrl,
        externalPaymentId: payment.externalPaymentId,
        externalReference: payment.externalReference,
      },
      where: { id: paymentId },
    }),
    db.payment.updateMany({
      data: {
        rawStatus: payment.rawStatus,
        status: mapPaymentStatus(payment.status),
      },
      where: {
        id: paymentId,
        status: PrismaPaymentStatus.PENDING,
      },
    }),
    db.paymentEvent.create({
      data: {
        eventType: "payment.created",
        isValid: true,
        payloadJson: toJsonPayload(payment.rawPayload),
        paymentId,
        provider: payment.provider,
      },
    }),
  ]);
}

async function cancelPendingOrderAfterPaymentFailure(orderNumber: string) {
  await cancelPaymentProcessingOrder({
    orderNumber,
    paymentStatus: PrismaPaymentStatus.FAILED,
    rawStatus: "PAYMENT_CREATION_FAILED",
  });
}

async function createDeliveryAddress(
  tx: Prisma.TransactionClient,
  input: CheckoutInput,
  deliveryZone: DeliveryZoneOption | undefined,
) {
  if (input.fulfillmentMethod === "PICKUP") return undefined;
  if (!deliveryZone) throw new CheckoutDomainError("coverage_unavailable");

  const address = await tx.address.create({
    data: {
      addressLine1: input.addressLine1 ?? "",
      addressLine2: input.addressLine2 || undefined,
      city: deliveryZone.city,
      country: "SV",
      deliveryNotes: input.deliveryNotes || undefined,
      department: deliveryZone.department,
      formattedAddress: buildFormattedAddress({
        ...input,
        city: deliveryZone.city,
        department: deliveryZone.department,
      }),
      latitude: input.latitude,
      longitude: input.longitude,
      placeId: input.placeId,
    },
    select: {
      id: true,
    },
  });

  return address.id;
}

function resolveCheckoutDeliveryZone(input: CheckoutInput, zones: DeliveryZoneOption[]) {
  if (input.fulfillmentMethod !== "LOCAL_DELIVERY") return undefined;

  return getDeliveryZoneBySlug(input.deliveryZoneSlug, zones);
}

function getCheckoutShippingCents(
  input: CheckoutInput,
  deliveryZone: DeliveryZoneOption | undefined,
) {
  if (input.fulfillmentMethod !== "LOCAL_DELIVERY") return 0;
  if (!deliveryZone) throw new CheckoutDomainError("coverage_unavailable");

  return deliveryZone.feeCents;
}

function getDeliveryZoneName(deliveryZone: DeliveryZoneOption | undefined) {
  if (!deliveryZone) throw new CheckoutDomainError("coverage_unavailable");

  return deliveryZone.name;
}

function buildOrderNotes(input: CheckoutInput) {
  return [
    `Entrega: ${getFulfillmentLabel(input.fulfillmentMethod)}`,
    input.deliveryNotes ? `Notas: ${input.deliveryNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function isUnavailable(status: InventoryStatus | undefined) {
  return !status || status === InventoryStatus.OUT_OF_STOCK || status === InventoryStatus.PREORDER;
}

async function createPayment(
  provider: PaymentProvider,
  {
    amountCents,
    customerEmail,
    orderNumber,
    redirectUrl,
  }: {
    amountCents: number;
    customerEmail: string;
    orderNumber: string;
    redirectUrl: string;
  },
): Promise<CreatePaymentResult> {
  try {
    return await provider.createPayment({
      amountCents,
      currency: "USD",
      customerEmail,
      metadata: {
        source: "guest_checkout",
      },
      orderNumber,
      redirectUrl,
    });
  } catch (error) {
    logError({ context: "createGuestCheckoutFromCart" }, error);
    throw new CheckoutDomainError("payment_unavailable");
  }
}

function mapPaymentStatus(status: PaymentStatus) {
  const statusMap: Record<PaymentStatus, PrismaPaymentStatus> = {
    CANCELLED: PrismaPaymentStatus.CANCELLED,
    FAILED: PrismaPaymentStatus.FAILED,
    PAID: PrismaPaymentStatus.PAID,
    PENDING: PrismaPaymentStatus.PENDING,
    REFUNDED: PrismaPaymentStatus.REFUNDED,
  };

  return statusMap[status];
}

function toJsonPayload(value: unknown) {
  return (value ?? {}) as Prisma.InputJsonValue;
}
