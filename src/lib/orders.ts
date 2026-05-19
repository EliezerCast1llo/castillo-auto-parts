import { InventoryStatus, OrderStatus, type Prisma } from "@prisma/client";
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

export type CreatePendingOrderResult =
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
  constructor(readonly code: Exclude<CreatePendingOrderResult["status"], "created">) {
    super(code);
  }
}

export async function createPendingOrderFromGuestCart(
  formData: FormData,
): Promise<CreatePendingOrderResult> {
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
      const orderLines = cart.lines.map((line) => {
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
          brandSnapshot: product.brand,
          lineTotalCents,
          partNumberSnapshot: product.partNumber,
          productId: product.id,
          productNameSnapshot: product.name,
          quantity: line.quantity,
          skuSnapshot: product.sku,
          taxCents: calculateIncludedTaxCents(lineTotalCents),
          unitPriceCents: product.priceCents,
        };
      });

      const subtotalCents = orderLines.reduce((total, line) => total + line.lineTotalCents, 0);
      const totalCents = subtotalCents + shippingCents;
      const addressId = await createDeliveryAddress(tx, parsed.data);
      const orderNumber = buildOrderNumber();

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
          shippingCents,
          status: OrderStatus.PENDING_PAYMENT,
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
