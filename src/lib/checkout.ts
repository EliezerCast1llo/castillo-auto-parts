import { z } from "zod";
import { getDeliveryFeeCents, type DeliveryZoneOption } from "./fulfillment";

export const fulfillmentMethods = ["PICKUP", "LOCAL_DELIVERY"] as const;

export type FulfillmentMethod = (typeof fulfillmentMethods)[number];

export const checkoutSchema = z
  .object({
    addressLine1: optionalLimitedString(160),
    addressLine2: optionalLimitedString(120),
    city: optionalLimitedString(80),
    customerEmail: z.string().trim().email("Ingresa un email válido.").max(254, "El email es demasiado largo."),
    customerName: z
      .string()
      .trim()
      .min(2, "Ingresa el nombre completo.")
      .max(120, "El nombre es demasiado largo."),
    customerPhone: z
      .string()
      .trim()
      .min(8, "Ingresa un teléfono válido.")
      .max(32, "El teléfono es demasiado largo."),
    deliveryNotes: optionalLimitedString(500),
    department: optionalLimitedString(80),
    fulfillmentMethod: z.enum(fulfillmentMethods),
    paymentMethod: z.literal("online_card"),
  })
  .superRefine((data, context) => {
    if (data.fulfillmentMethod !== "LOCAL_DELIVERY") return;

    if (!data.addressLine1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresa una dirección de entrega.",
        path: ["addressLine1"],
      });
    }

    if (!data.city) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona el municipio de entrega.",
        path: ["city"],
      });
    }

    if (!data.department) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona el departamento de entrega.",
        path: ["department"],
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export function parseCheckoutFormData(formData: FormData) {
  return checkoutSchema.safeParse({
    addressLine1: optionalFormString(formData, "addressLine1"),
    addressLine2: optionalFormString(formData, "addressLine2"),
    city: optionalFormString(formData, "city"),
    customerEmail: formString(formData, "customerEmail"),
    customerName: formString(formData, "customerName"),
    customerPhone: formString(formData, "customerPhone"),
    deliveryNotes: optionalFormString(formData, "deliveryNotes"),
    department: optionalFormString(formData, "department"),
    fulfillmentMethod: formString(formData, "fulfillmentMethod"),
    paymentMethod: formString(formData, "paymentMethod"),
  });
}

export function calculateShippingCents(
  method: FulfillmentMethod,
  city?: string,
  zones?: DeliveryZoneOption[],
) {
  if (method === "PICKUP") return 0;
  return getDeliveryFeeCents(city, zones);
}

export function calculateIncludedTaxCents(totalCents: number) {
  return Math.round((totalCents * 13) / 113);
}

export function buildOrderNumber(date = new Date(), suffix = randomOrderSuffix()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `CAP-${year}${month}${day}-${suffix}`;
}

export function getFulfillmentLabel(method: FulfillmentMethod) {
  return method === "PICKUP" ? "Retiro en bodega" : "Envío local";
}

export function buildFormattedAddress(input: CheckoutInput) {
  const parts = [
    input.addressLine1,
    input.addressLine2,
    input.city,
    input.department,
    "El Salvador",
  ].filter(Boolean);

  return parts.join(", ");
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function optionalFormString(formData: FormData, key: string) {
  const value = formString(formData, key).trim();
  return value || undefined;
}

function optionalLimitedString(maxLength: number) {
  return z.string().trim().max(maxLength, `Máximo ${maxLength} caracteres.`).optional();
}

function randomOrderSuffix() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
