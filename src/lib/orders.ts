import {
  InventoryStatus,
  OrderStatus,
  PaymentStatus as PrismaPaymentStatus,
  type Prisma,
} from "@prisma/client";
import { clearGuestCart, getGuestCart } from "./cart";
import {
  buildFormattedAddress,
  buildOrderNumber,
  calculateIncludedTaxCents,
  getFulfillmentLabel,
  parseCheckoutFormData,
  type CheckoutInput,
} from "./checkout";
import { db } from "./db";
import {
  getActiveDeliveryZones,
  getDeliveryZoneBySlug,
  type DeliveryZoneOption,
} from "./fulfillment";
import { sendOrderConfirmationEmail } from "./email/transactional";
import { buildAbsoluteAppUrl } from "./email/templates";
import { buildOrderAccessHref, createOrderAccessToken, hashOrderAccessToken } from "./order-access-token";
import { getPaymentProvider, type CreatePaymentResult, type PaymentStatus } from "./payments";

export type CreateGuestOrderResult =
  | { accessToken: string; orderNumber: string; status: "created" }
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

export async function createPaidGuestOrderFromCart(
  formData: FormData,
): Promise<CreateGuestOrderResult> {
  const parsed = parseCheckoutFormData(formData);
  if (!parsed.success) return { status: "invalid" };

  const cart = await getGuestCart();
  if (cart.lines.length === 0) return { status: "empty_cart" };
  if (cart.hasBlockingIssues) return { status: "stock_issue" };

  try {
    const deliveryZones = await getActiveDeliveryZones();
    const deliveryZone = resolveCheckoutDeliveryZone(parsed.data, deliveryZones);
    if (parsed.data.fulfillmentMethod === "LOCAL_DELIVERY" && !deliveryZone) {
      return { status: "coverage_unavailable" };
    }

    const shippingCents = getCheckoutShippingCents(parsed.data, deliveryZone);

    const order = await db.$transaction(async (tx) => {
      const dbProducts = await tx.product.findMany({
        where: {
          sku: { in: cart.lines.map((line) => line.product.sku) },
          isActive: true,
        },
        include: {
          inventoryStocks: true,
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
        const nextAvailableQuantity = availableQuantity - line.quantity;

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
          quantity: line.quantity,
          requiredQuantityOnHand: stock.quantityReserved + line.quantity,
          stockId: stock.id,
          stockStatus: getNextStockStatus(nextAvailableQuantity, stock.reorderPoint),
        };
      });

      const stockUpdates = await Promise.all(
        preparedLines.map((line) =>
          tx.inventoryStock.updateMany({
            data: {
              quantityOnHand: {
                decrement: line.quantity,
              },
              status: line.stockStatus,
            },
            where: {
              id: line.stockId,
              quantityOnHand: {
                gte: line.requiredQuantityOnHand,
              },
              status: {
                notIn: [InventoryStatus.OUT_OF_STOCK, InventoryStatus.PREORDER],
              },
            },
          }),
        ),
      );

      if (stockUpdates.some((update) => update.count !== 1)) {
        throw new CheckoutDomainError("stock_issue");
      }

      const orderLines = preparedLines.map((line) => line.orderItem);
      const subtotalCents = orderLines.reduce((total, line) => total + line.lineTotalCents, 0);
      const totalCents = subtotalCents + shippingCents;
      const addressId = await createDeliveryAddress(tx, parsed.data, deliveryZone);
      const orderNumber = buildOrderNumber();
      const accessToken = createOrderAccessToken();
      const payment = await createPayment({
        amountCents: totalCents,
        customerEmail: parsed.data.customerEmail,
        orderNumber,
        redirectUrl: buildOrderAccessHref(orderNumber, accessToken),
      });

      if (payment.status !== "PAID") {
        throw new CheckoutDomainError("payment_unavailable");
      }

      const paidAt = payment.paidAt ?? new Date();

      const savedOrder = await tx.order.create({
        data: {
          accessTokenHash: hashOrderAccessToken(accessToken),
          addressId,
          currency: "USD",
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
          paidAt,
          payment: {
            create: {
              amountCents: totalCents,
              checkoutUrl: payment.checkoutUrl,
              currency: "USD",
              events: {
                create: {
                  eventType: "payment.confirmed",
                  externalEventId: payment.externalPaymentId,
                  isValid: true,
                  payloadJson: toJsonPayload(payment.rawPayload),
                  provider: payment.provider,
                },
              },
              externalPaymentId: payment.externalPaymentId,
              externalReference: payment.externalReference,
              paidAt,
              provider: payment.provider,
              rawStatus: payment.rawStatus,
              status: mapPaymentStatus(payment.status),
            },
          },
          shippingCents,
          status: OrderStatus.PAID_PENDING_SHIPMENT,
          subtotalCents,
          taxCents: calculateIncludedTaxCents(totalCents),
          totalCents,
        },
        select: {
          orderNumber: true,
        },
      });

      return {
        accessToken,
        customerEmail: parsed.data.customerEmail,
        customerName: parsed.data.customerName,
        orderNumber: savedOrder.orderNumber,
        totalCents,
      };
    });

    await clearGuestCart();
    await sendOrderConfirmationEmail({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      orderUrl: buildAbsoluteAppUrl(buildOrderAccessHref(order.orderNumber, order.accessToken)),
      totalCents: order.totalCents,
    });

    return { accessToken: order.accessToken, orderNumber: order.orderNumber, status: "created" };
  } catch (error) {
    if (error instanceof CheckoutDomainError) {
      return { status: error.code };
    }

    console.error(error);
    return { status: "db_unavailable" };
  }
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

function getNextStockStatus(availableQuantity: number, reorderPoint: number) {
  if (availableQuantity <= 0) return InventoryStatus.OUT_OF_STOCK;
  if (availableQuantity <= reorderPoint) return InventoryStatus.LOW_STOCK;
  return InventoryStatus.IN_STOCK;
}

async function createPayment({
  amountCents,
  customerEmail,
  orderNumber,
  redirectUrl,
}: {
  amountCents: number;
  customerEmail: string;
  orderNumber: string;
  redirectUrl: string;
}): Promise<CreatePaymentResult> {
  try {
    return await getPaymentProvider().createPayment({
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
    console.error(error);
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
