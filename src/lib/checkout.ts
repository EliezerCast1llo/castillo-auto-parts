import { randomBytes } from "node:crypto";
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
    deliveryZoneSlug: optionalLimitedString(80),
    department: optionalLimitedString(80),
    formattedAddress: optionalLimitedString(260),
    fulfillmentMethod: z.enum(fulfillmentMethods),
    latitude: optionalCoordinate(-90, 90, "latitud"),
    longitude: optionalCoordinate(-180, 180, "longitud"),
    paymentMethod: z.literal("online_card"),
    placeId: optionalLimitedString(160),
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

    if (!data.deliveryZoneSlug) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona la zona de entrega.",
        path: ["deliveryZoneSlug"],
      });
    }

    if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona la ubicación exacta en el mapa.",
        path: ["latitude"],
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
    deliveryZoneSlug: optionalFormString(formData, "deliveryZoneSlug"),
    department: optionalFormString(formData, "department"),
    formattedAddress: optionalFormString(formData, "formattedAddress"),
    fulfillmentMethod: formString(formData, "fulfillmentMethod"),
    latitude: formString(formData, "latitude"),
    longitude: formString(formData, "longitude"),
    paymentMethod: formString(formData, "paymentMethod"),
    placeId: optionalFormString(formData, "placeId"),
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

export function calculateOrderTaxCents({
  itemTaxCents,
  shippingCents,
}: {
  itemTaxCents: number[];
  shippingCents: number;
}) {
  const itemsTaxCents = itemTaxCents.reduce((total, taxCents) => total + taxCents, 0);

  // Regla fiscal provisional del MVP: productos y envio son precios finales
  // al consumidor con IVA incluido. T-040 debe ratificarla antes de emitir DTE.
  return itemsTaxCents + calculateIncludedTaxCents(shippingCents);
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
  if (input.formattedAddress) return input.formattedAddress;

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

function optionalCoordinate(min: number, max: number, label: string) {
  return z.preprocess((value) => {
    if (typeof value === "string") {
      const trimmedValue = value.trim();
      return trimmedValue ? Number(trimmedValue) : undefined;
    }

    return value;
  }, z.number({ invalid_type_error: `Ingresa una ${label} válida.` }).min(min).max(max).optional());
}

function randomOrderSuffix() {
  // 3 bytes → 6 chars hex → 16 millones de combinaciones, criptográficamente seguro.
  // Math.random() era predecible y podía generar colisiones bajo carga.
  return randomBytes(3).toString("hex").toUpperCase();
}
