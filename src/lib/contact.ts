export const SUPPORT_WHATSAPP_NUMBER = sanitizeWhatsAppNumber(
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER,
);

// Existing public contact for landing and shipping fallbacks when no override is configured.
export const DEFAULT_SUPPORT_WHATSAPP_NUMBER = "50378907671";

export function buildContactLinks(phone = SUPPORT_WHATSAPP_NUMBER ?? DEFAULT_SUPPORT_WHATSAPP_NUMBER, message?: string) {
  const digits = sanitizeWhatsAppNumber(phone);
  if (!digits) throw new Error("Invalid public contact number.");
  return {
    whatsapp: `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`,
    telephone: `tel:+${digits}`,
    displayPhone: digits.startsWith("503") && digits.length === 11
      ? `+503 ${digits.slice(3, 7)} ${digits.slice(7)}` : `+${digits}`,
  };
}

function sanitizeWhatsAppNumber(value: string | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length >= 8 ? digits : undefined;
}
