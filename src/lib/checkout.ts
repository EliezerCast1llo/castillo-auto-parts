import { z } from "zod";

export const fulfillmentMethods = ["PICKUP", "LOCAL_DELIVERY"] as const;

export type FulfillmentMethod = (typeof fulfillmentMethods)[number];

export const checkoutSchema = z
  .object({
    addressLine1: z.string().trim().optional(),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    customerEmail: z.string().trim().email("Ingresa un email válido."),
    customerName: z.string().trim().min(2, "Ingresa el nombre completo."),
    customerPhone: z.string().trim().min(8, "Ingresa un teléfono válido."),
    deliveryNotes: z.string().trim().optional(),
    department: z.string().trim().optional(),
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

const deliveryFeesByCity = new Map([
  ["san salvador", 300],
  ["santa tecla", 200],
]);

export function parseCheckoutFormData(formData: FormData) {
  return checkoutSchema.safeParse({
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    customerEmail: formData.get("customerEmail"),
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    deliveryNotes: formData.get("deliveryNotes"),
    department: formData.get("department"),
    fulfillmentMethod: formData.get("fulfillmentMethod"),
    paymentMethod: formData.get("paymentMethod"),
  });
}

export function calculateShippingCents(method: FulfillmentMethod, city?: string) {
  if (method === "PICKUP") return 0;
  return deliveryFeesByCity.get(normalizeCoverageValue(city ?? "")) ?? null;
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

function normalizeCoverageValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function randomOrderSuffix() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
