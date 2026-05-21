import { z } from "zod";
import { normalizeCartSku, sanitizeCartQuantity } from "./cart-validation";
import { db } from "./db";

export type CreateStockAlertResult = "created" | "db_unavailable" | "invalid" | "not_found";
export const stockAlertStatuses = ["OPEN", "NOTIFIED", "CLOSED", "CANCELLED"] as const;

export type StockAlertStatus = (typeof stockAlertStatuses)[number];

const stockAlertSchema = z
  .object({
    customerEmail: z.string().trim().email().max(254).optional(),
    customerPhone: z.string().trim().min(8).max(32).optional(),
    requestedQuantity: z.preprocess(
      (value) => Number(value),
      z.number().int().min(1).max(99),
    ),
    sku: z.string().trim().min(1).max(64),
  })
  .superRefine((data, context) => {
    if (data.customerEmail || data.customerPhone) return;

    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ingresa email o teléfono.",
      path: ["customerEmail"],
    });
  });

export type StockAlertInput = z.infer<typeof stockAlertSchema>;

export function parseStockAlertFormData(formData: FormData) {
  const sku = normalizeCartSku(formString(formData, "sku"));

  return stockAlertSchema.safeParse({
    customerEmail: optionalFormString(formData, "customerEmail"),
    customerPhone: optionalFormString(formData, "customerPhone"),
    requestedQuantity: formString(formData, "requestedQuantity") || "1",
    sku,
  });
}

export function parseStockAlertStatus(value: string) {
  return stockAlertStatuses.find((status) => status === value) ?? null;
}

export async function createStockAlertRequest(formData: FormData): Promise<CreateStockAlertResult> {
  const parsed = parseStockAlertFormData(formData);
  if (!parsed.success) return "invalid";

  try {
    const product = await db.product.findUnique({
      where: { sku: parsed.data.sku },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });

    if (!product) return "not_found";

    const existingAlert = await db.stockAlertRequest.findFirst({
      where: {
        OR: buildContactFilters(parsed.data),
        skuSnapshot: product.sku,
        status: "OPEN",
      },
      select: {
        id: true,
        requestedQuantity: true,
      },
    });

    if (existingAlert) {
      await db.stockAlertRequest.update({
        data: {
          requestedQuantity: Math.max(
            existingAlert.requestedQuantity,
            sanitizeCartQuantity(parsed.data.requestedQuantity),
          ),
        },
        where: { id: existingAlert.id },
      });

      return "created";
    }

    await db.stockAlertRequest.create({
      data: {
        email: parsed.data.customerEmail,
        phone: parsed.data.customerPhone,
        productId: product.id,
        productNameSnapshot: product.name,
        requestedQuantity: sanitizeCartQuantity(parsed.data.requestedQuantity),
        skuSnapshot: product.sku,
        source: "cart",
        status: "OPEN",
      },
    });

    return "created";
  } catch (error) {
    console.error(error);
    return "db_unavailable";
  }
}

function buildContactFilters(input: StockAlertInput) {
  return [
    input.customerEmail ? { email: input.customerEmail } : null,
    input.customerPhone ? { phone: input.customerPhone } : null,
  ].filter((item): item is { email: string } | { phone: string } => Boolean(item));
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormString(formData: FormData, key: string) {
  return formString(formData, key) || undefined;
}
