export const SUPPORT_WHATSAPP_NUMBER = sanitizeWhatsAppNumber(
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER,
);

function sanitizeWhatsAppNumber(value: string | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 8 ? digits : undefined;
}
