import {
  InventoryStatus,
  OrderStatus,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from "@prisma/client";
import { clearGuestCart, getGuestCart, type GuestCart } from "./cart";
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
import { deriveScopedIdempotencyKey } from "./checkout-idempotency";
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
  | { accessToken?: string; checkoutUrl: string; orderNumber: string; status: "created" }
  | {
      status:
        | "coverage_unavailable"
        | "db_unavailable"
        | "duplicate_in_progress"
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

  // Idempotencia: se resuelve tras leer el carrito pero ANTES de los guards, para
  // que un re-submit tras una compra (carrito ya vacío) reproduzca el checkout en
  // vez de fallar como empty_cart, SIN pisar un carrito reconstruido.
  let effectiveIdempotencyKey = idempotencyKey;
  let deadKeyToRelease: string | undefined;
  if (idempotencyKey) {
    const existing = await findOrderByIdempotencyKey(idempotencyKey);
    if (existing) {
      // Scope de identidad: una orden de un usuario autenticado solo la reproduce
      // ese mismo usuario. Un invitado (userId undefined) nunca reproduce una orden
      // con dueño. Evita que en una máquina compartida se filtre el checkout ajeno.
      const identityMismatch = existing.userId !== null && existing.userId !== userId;

      // Mismo intento solo si el carrito está vacío (volver atrás tras la compra) o
      // coincide con los items de la orden (doble-click del mismo carrito). Si el
      // carrito fue reconstruido con otros items, NO reproducir ni borrarlo.
      const sameIntent = cart.lines.length === 0 || cartMatchesOrder(cart, existing.items);

      if (identityMismatch || !sameIntent) {
        // La key original no aplica. En vez de descartarla (key null no colisiona →
        // dos submits concurrentes duplicarían), se deriva una key estable de
        // (key + carrito): submits idénticos siguen deduplicando.
        effectiveIdempotencyKey = deriveScopedIdempotencyKey(idempotencyKey, cartFingerprint(cart));
      } else {
        const replay = replayResultForOrder(existing);
        if (replay) {
          await clearGuestCartSafely();
          return replay;
        }
        if (idempotencyStateForOrder(existing) !== "dead") {
          // Carrera concurrente: el ganador aún no persiste checkoutUrl. No es un
          // error terminal; el cliente reintenta.
          return { status: "duplicate_in_progress" };
        }
        // Orden muerta (expirada/cancelada/fallida): liberar su key para reusarla,
        // pero solo tras pasar los guards (no anularla si el request aborta).
        deadKeyToRelease = idempotencyKey;
      }
    }
  }

  if (cart.lines.length === 0) return { status: "empty_cart" };
  if (cart.hasBlockingIssues) return { status: "stock_issue" };

  if (deadKeyToRelease) await releaseIdempotencyKey(deadKeyToRelease);

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

    await clearGuestCartSafely();

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
    // creó la orden; el @unique de idempotencyKey rechaza al perdedor con P2002.
    // Solo tratar así cuando el conflicto es de idempotencyKey (no otro índice).
    if (
      effectiveIdempotencyKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      isIdempotencyKeyConflict(error)
    ) {
      const existing = await findOrderByIdempotencyKey(effectiveIdempotencyKey);
      const replay = existing ? replayResultForOrder(existing) : null;
      if (replay) {
        await clearGuestCartSafely();
        return replay;
      }
      // Ganador aún sin checkoutUrl persistido: reintento, no error terminal.
      return { status: "duplicate_in_progress" };
    }

    logError({ context: "createGuestCheckoutFromCart" }, error);
    return { status: "db_unavailable" };
  }
}

export type IdempotentOrderLookup = {
  orderNumber: string;
  status: OrderStatus;
  userId: string | null;
  reservationExpiresAt: Date | null;
  items: { skuSnapshot: string; quantity: number }[];
  payment: { checkoutUrl: string | null } | null;
};

export type IdempotencyState = "replay" | "in_flight" | "dead";

function findOrderByIdempotencyKey(idempotencyKey: string): Promise<IdempotentOrderLookup | null> {
  return db.order.findUnique({
    where: { idempotencyKey },
    select: {
      orderNumber: true,
      status: true,
      userId: true,
      reservationExpiresAt: true,
      items: { select: { skuSnapshot: true, quantity: true } },
      payment: { select: { checkoutUrl: true } },
    },
  });
}

// Un carrito coincide con una orden si tiene exactamente los mismos SKUs y
// cantidades. Discrimina el doble-click del mismo carrito (reproducir) de un
// carrito reconstruido con otros items (crear orden nueva, no pisar el carrito).
export function cartMatchesOrder(cart: GuestCart, items: IdempotentOrderLookup["items"]): boolean {
  if (cart.lines.length !== items.length) return false;

  const orderQuantities = new Map(items.map((item) => [item.skuSnapshot, item.quantity]));
  for (const line of cart.lines) {
    if (orderQuantities.get(line.product.sku) !== line.quantity) return false;
  }
  return true;
}

// Huella determinística del carrito (SKUs+cantidades ordenados). Igual para dos
// carritos con el mismo contenido, base para derivar una key de idempotencia estable.
export function cartFingerprint(cart: GuestCart): string {
  return cart.lines
    .map((line) => `${line.product.sku}:${line.quantity}`)
    .sort()
    .join(",");
}

async function releaseIdempotencyKey(idempotencyKey: string) {
  // Libera la key de una orden muerta para que un nuevo intento pueda reusarla
  // sin colisionar con el @unique. updateMany es idempotente ante concurrencia.
  await db.order.updateMany({
    where: { idempotencyKey },
    data: { idempotencyKey: null },
  });
}

async function clearGuestCartSafely() {
  try {
    await clearGuestCart();
  } catch (error) {
    logError({ context: "clearGuestCartAfterPendingOrder" }, error);
  }
}

function isIdempotencyKeyConflict(error: Prisma.PrismaClientKnownRequestError): boolean {
  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes("idempotencyKey");
  return typeof target === "string" && target.includes("idempotencyKey");
}

// Estado de una orden previa hallada por idempotencyKey:
// - replay: viva y con checkout listo → reutilizar su checkoutUrl.
// - in_flight: viva pero el pago aún no persiste checkoutUrl (carrera concurrente).
// - dead: expirada/cancelada/fallida → la key puede liberarse.
export function idempotencyStateForOrder(order: IdempotentOrderLookup): IdempotencyState {
  const isActive =
    order.status === OrderStatus.PAYMENT_PROCESSING &&
    order.reservationExpiresAt !== null &&
    order.reservationExpiresAt.getTime() > Date.now();

  if (!isActive) return "dead";
  return order.payment?.checkoutUrl ? "replay" : "in_flight";
}

// Devuelve el resultado "created" reutilizable solo si la orden está en estado replay.
export function replayResultForOrder(order: IdempotentOrderLookup): CreateGuestOrderResult | null {
  if (idempotencyStateForOrder(order) !== "replay") return null;

  // En un replay el checkoutUrl ya está persistido; el accessToken (plano) solo
  // existe en el primer submit para armar el redirect del proveedor, no se necesita.
  return {
    checkoutUrl: order.payment!.checkoutUrl!,
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
