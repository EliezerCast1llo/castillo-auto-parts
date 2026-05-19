import { InventoryStatus, OrderStatus, PaymentStatus, type Prisma } from "@prisma/client";
import { clearGuestCart, getGuestCart } from "./cart";
import {
  buildFormattedAddress,
  buildOrderNumber,
  calculateIncludedTaxCents,
  calculateShippingCents,
  getFulfillmentLabel,
  parseCheckoutFormData,
  type CheckoutInput,
} from "./checkout";
import { db } from "./db";

export type CreateGuestOrderResult =
  | { orderNumber: string; status: "created" }
  | {
      status:
        | "coverage_unavailable"
        | "db_unavailable"
        | "empty_cart"
        | "invalid"
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

  const shippingCents = calculateShippingCents(parsed.data.fulfillmentMethod, parsed.data.city);
  if (shippingCents === null) return { status: "coverage_unavailable" };

  try {
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
      const addressId = await createDeliveryAddress(tx, parsed.data);
      const orderNumber = buildOrderNumber();
      const paidAt = new Date();

      return tx.order.create({
        data: {
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
                  ? parsed.data.city
                  : "Bodega principal",
              method: parsed.data.fulfillmentMethod,
              notes: parsed.data.deliveryNotes,
            },
          },
          paidAt,
          payment: {
            create: {
              amountCents: totalCents,
              checkoutUrl: `/orders/${orderNumber}`,
              currency: "USD",
              externalPaymentId: `SIM-${orderNumber}`,
              externalReference: orderNumber,
              paidAt,
              provider: "simulated_web_checkout",
              rawStatus: "SIMULATED_PAID",
              status: PaymentStatus.PAID,
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
    });

    await clearGuestCart();
    return { orderNumber: order.orderNumber, status: "created" };
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
) {
  if (input.fulfillmentMethod === "PICKUP") return undefined;

  const address = await tx.address.create({
    data: {
      addressLine1: input.addressLine1 ?? "",
      addressLine2: input.addressLine2 || undefined,
      city: input.city ?? "",
      country: "SV",
      deliveryNotes: input.deliveryNotes || undefined,
      department: input.department ?? "",
      formattedAddress: buildFormattedAddress(input),
    },
    select: {
      id: true,
    },
  });

  return address.id;
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
