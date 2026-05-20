import { formatCurrency } from "../money";
import { getTransactionalEmailFrom } from ".";
import type { EmailMessage } from "./provider";

export type OrderConfirmationEmailInput = {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderUrl: string;
  totalCents: number;
};

export function buildOrderConfirmationEmail(
  input: OrderConfirmationEmailInput,
): EmailMessage {
  const total = formatCurrency(input.totalCents);
  const subject = `Confirmación de orden ${input.orderNumber}`;

  return {
    from: getTransactionalEmailFrom(),
    html: [
      `<p>Hola ${escapeHtml(input.customerName)},</p>`,
      `<p>Recibimos tu orden <strong>${escapeHtml(input.orderNumber)}</strong> por <strong>${total}</strong>.</p>`,
      "<p>Tu compra quedó pendiente de preparación para entrega.</p>",
      `<p><a href="${escapeHtml(input.orderUrl)}">Ver estado de la orden</a></p>`,
      "<p>Gracias por comprar en Castillo Auto Parts.</p>",
    ].join("\n"),
    subject,
    text: [
      `Hola ${input.customerName},`,
      "",
      `Recibimos tu orden ${input.orderNumber} por ${total}.`,
      "Tu compra quedó pendiente de preparación para entrega.",
      `Ver estado de la orden: ${input.orderUrl}`,
      "",
      "Gracias por comprar en Castillo Auto Parts.",
    ].join("\n"),
    to: input.customerEmail,
  };
}

export function buildAbsoluteAppUrl(path: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000";

  return new URL(path, baseUrl).toString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
