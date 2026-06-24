export const SUPPORT_WHATSAPP_NUMBER = sanitizeWhatsAppNumber(
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER,
);

export const DEFAULT_SUPPORT_MESSAGE =
  "Hola, necesito ayuda para encontrar un repuesto compatible con mi vehículo.";

function sanitizeWhatsAppNumber(value: string | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 8 ? digits : undefined;
}
