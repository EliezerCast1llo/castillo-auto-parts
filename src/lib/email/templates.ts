import { createTranslator } from "use-intl/core";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { APP_TIME_ZONE } from "@/lib/i18n/intl-locale";
import { loadMessages } from "@/lib/i18n/messages";
import { localizePath } from "@/lib/i18n/path";
import { SITE_NAME } from "@/lib/site";
import { formatCurrency } from "../money";
import { getTransactionalEmailFrom } from ".";
import type { EmailMessage } from "./provider";

export type OrderConfirmationEmailInput = {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderUrl: string;
  totalCents: number;
  /**
   * Idioma en el que el cliente hizo la compra, guardado en la orden.
   *
   * Este correo se dispara desde el webhook del proveedor de pagos, que no
   * tiene request con segmento de idioma ni cookie del cliente: si no viniera
   * en la orden, no habría forma de saberlo.
   */
  locale: Locale;
};

/**
 * Traductor para código que no es un componente.
 *
 * Los correos no se renderizan: se arman y se mandan, y el de confirmación nace
 * en el webhook del proveedor de pagos, donde no hay request ni árbol de React.
 * `getTranslations` no sirve ahí —está atado al contexto de servidor de Next y
 * ni siquiera se puede cargar fuera de un Server Component— así que se usa el
 * traductor puro de `use-intl`, que solo necesita idioma y mensajes.
 *
 * De paso hace que estas funciones sean sincrónicas y testeables sin montar
 * nada alrededor.
 */
function emailTranslator(locale: Locale, namespace: "orderConfirmation" | "passwordReset") {
  return createTranslator({
    locale,
    messages: loadMessages(locale),
    namespace: `Email.${namespace}`,
    timeZone: APP_TIME_ZONE,
  });
}

export function buildOrderConfirmationEmail(input: OrderConfirmationEmailInput): EmailMessage {
  const t = emailTranslator(input.locale, "orderConfirmation");

  const total = formatCurrency(input.totalCents, input.locale);
  const greeting = t("greeting", { customerName: input.customerName });
  const received = t("received", { orderNumber: input.orderNumber, total });
  const pending = t("pending");
  const signature = t("signature", { siteName: SITE_NAME });

  return {
    from: getTransactionalEmailFrom(),
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(received)}</p>`,
      `<p>${escapeHtml(pending)}</p>`,
      `<p><a href="${escapeHtml(input.orderUrl)}">${escapeHtml(t("viewOrder"))}</a></p>`,
      `<p>${escapeHtml(signature)}</p>`,
    ].join("\n"),
    subject: t("subject", { orderNumber: input.orderNumber }),
    text: [
      greeting,
      "",
      received,
      pending,
      `${t("viewOrder")}: ${input.orderUrl}`,
      "",
      signature,
    ].join("\n"),
    to: input.customerEmail,
  };
}

export type PasswordResetEmailInput = {
  email: string;
  resetUrl: string;
  locale: Locale;
};

/**
 * Vivía inline en la server action de "olvidé mi contraseña". Ahí no se podía
 * traducir ni probar, y era el único correo del sistema fuera de este módulo.
 */
export function buildPasswordResetEmail(input: PasswordResetEmailInput): EmailMessage {
  const t = emailTranslator(input.locale, "passwordReset");

  const intro = t("intro");
  const ignore = t("ignore");

  return {
    from: getTransactionalEmailFrom(),
    html: [
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${escapeHtml(input.resetUrl)}">${escapeHtml(input.resetUrl)}</a></p>`,
      `<p>${escapeHtml(ignore)}</p>`,
    ].join("\n"),
    subject: t("subject", { siteName: SITE_NAME }),
    text: [intro, "", input.resetUrl, "", ignore].join("\n"),
    to: input.email,
  };
}

/**
 * URL absoluta de una ruta del storefront, con su prefijo de idioma.
 *
 * Un enlace sin prefijo funciona por el redirect permanente, pero ese redirect
 * lleva siempre a español: quien compró en inglés abriría su orden en el idioma
 * equivocado desde su propio correo.
 */
export function buildAbsoluteAppUrl(path: string, locale: Locale = defaultLocale) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000";

  return new URL(localizePath(path, locale), baseUrl).toString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
