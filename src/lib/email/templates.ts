import { createTranslator } from "use-intl/core";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { APP_TIME_ZONE } from "@/lib/i18n/intl-locale";
import { loadMessages } from "@/lib/i18n/messages";
import { localizePath } from "@/lib/i18n/path";
import { SITE_NAME } from "@/lib/site";
import { formatCurrency } from "../money";
import { getTransactionalEmailFrom } from ".";
import type { EmailMessage } from "./provider";

/**
 * Una línea de la compra, con los datos congelados al momento de comprar.
 *
 * Vienen de los `*Snapshot` de `OrderItem` y no del producto vivo: el correo
 * tiene que decir qué se compró y a qué precio, aunque el producto después
 * cambie de nombre o de precio.
 */
export type OrderConfirmationEmailItem = {
  name: string;
  sku: string;
  quantity: number;
  lineTotalCents: number;
};

export type OrderConfirmationEmailInput = {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderUrl: string;
  items: OrderConfirmationEmailItem[];
  subtotalCents: number;
  shippingCents: number;
  /**
   * Método de entrega, como identificador del enum y no como texto: el nombre
   * se resuelve contra el catálogo de mensajes, que ya lo tiene en los dos
   * idiomas. `null` cuando la orden todavía no tiene envío asignado.
   */
  fulfillmentMethod: "PICKUP" | "LOCAL_DELIVERY" | "NATIONAL_SHIPPING" | null;
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
  const money = (cents: number) => formatCurrency(cents, input.locale);

  const total = money(input.totalCents);
  const greeting = t("greeting", { customerName: input.customerName });
  const received = t("received", { orderNumber: input.orderNumber, total });
  const pending = t("pending");
  const signature = t("signature", { siteName: SITE_NAME });

  // El envío gratis se dice con palabras y no con "$0.00": retiro en bodega
  // cuesta cero y leerlo como monto hace dudar de si se cobró algo.
  const shipping = input.shippingCents > 0 ? money(input.shippingCents) : t("freeShipping");
  const methodName = input.fulfillmentMethod
    ? fulfillmentMethodName(input.fulfillmentMethod, input.locale)
    : null;

  const summaryRows: [string, string][] = [
    [t("subtotal"), money(input.subtotalCents)],
    [t("shipping"), shipping],
    [t("total"), total],
  ];

  return {
    from: getTransactionalEmailFrom(),
    html: [
      `<p>${escapeHtml(greeting)}</p>`,
      `<p>${escapeHtml(received)}</p>`,
      `<p>${escapeHtml(pending)}</p>`,
      `<h2 style="font-size:16px;margin:24px 0 8px">${escapeHtml(t("summaryTitle"))}</h2>`,
      itemsHtml(input, t),
      summaryHtml(summaryRows),
      methodName
        ? `<p><strong>${escapeHtml(t("deliveryMethod"))}:</strong> ${escapeHtml(methodName)}</p>`
        : "",
      `<p><a href="${escapeHtml(input.orderUrl)}">${escapeHtml(t("viewOrder"))}</a></p>`,
      `<p>${escapeHtml(signature)}</p>`,
    ]
      .filter(Boolean)
      .join("\n"),
    subject: t("subject", { orderNumber: input.orderNumber }),
    text: [
      greeting,
      "",
      received,
      pending,
      "",
      t("summaryTitle"),
      ...input.items.map(
        (item) =>
          `- ${t("itemLine", { name: item.name, quantity: item.quantity })}` +
          ` (${t("itemSku", { sku: item.sku })}) — ${money(item.lineTotalCents)}`,
      ),
      "",
      ...summaryRows.map(([label, value]) => `${label}: ${value}`),
      ...(methodName ? [`${t("deliveryMethod")}: ${methodName}`] : []),
      "",
      `${t("viewOrder")}: ${input.orderUrl}`,
      "",
      signature,
    ].join("\n"),
    to: input.customerEmail,
  };
}

/**
 * Nombre del método de entrega.
 *
 * Sale del namespace `Orders`, que ya lo tiene en los dos idiomas desde la
 * tajada de pedidos: duplicarlo en `Email` dejaría dos textos para la misma
 * cosa, y uno de los dos se desactualizaría.
 */
function fulfillmentMethodName(
  method: NonNullable<OrderConfirmationEmailInput["fulfillmentMethod"]>,
  locale: Locale,
) {
  const t = createTranslator({
    locale,
    messages: loadMessages(locale),
    namespace: "Orders.method",
    timeZone: APP_TIME_ZONE,
  });

  return t(method);
}

type OrderEmailTranslator = ReturnType<typeof emailTranslator>;

function itemsHtml(input: OrderConfirmationEmailInput, t: OrderEmailTranslator) {
  if (input.items.length === 0) return "";

  // Tabla y no lista: los clientes de correo no soportan flex ni grid, y una
  // tabla con `align` es lo único que alinea importes de forma confiable.
  const rows = input.items
    .map((item) => {
      const line = escapeHtml(t("itemLine", { name: item.name, quantity: item.quantity }));
      const sku = escapeHtml(t("itemSku", { sku: item.sku }));
      const amount = escapeHtml(formatCurrency(item.lineTotalCents, input.locale));

      return (
        `<tr><td style="padding:6px 12px 6px 0">${line}<br>` +
        `<span style="color:#667085;font-size:12px">${sku}</span></td>` +
        `<td align="right" style="padding:6px 0;white-space:nowrap">${amount}</td></tr>`
      );
    })
    .join("");

  return `<table role="presentation" style="border-collapse:collapse;width:100%">${rows}</table>`;
}

function summaryHtml(rows: [string, string][]) {
  const cells = rows
    .map(([label, value], index) => {
      const strong = index === rows.length - 1;
      const weight = strong ? "font-weight:700" : "";
      const border = index === 0 ? "border-top:1px solid #e4e7ec" : "";

      return (
        `<tr><td style="padding:6px 12px 6px 0;${weight};${border}">${escapeHtml(label)}</td>` +
        `<td align="right" style="padding:6px 0;${weight};${border};white-space:nowrap">${escapeHtml(value)}</td></tr>`
      );
    })
    .join("");

  return `<table role="presentation" style="border-collapse:collapse;width:100%">${cells}</table>`;
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
