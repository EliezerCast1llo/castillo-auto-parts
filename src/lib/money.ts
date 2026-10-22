import { defaultLocale, type Locale } from "./i18n/config";
import { APP_CURRENCY, toIntlLocale } from "./i18n/intl-locale";

/**
 * Formatea centavos como precio.
 *
 * **La moneda no cambia con el idioma**: El Salvador está dolarizado, así que
 * un cliente que navega en inglés paga los mismos dólares. Lo único que cambia
 * es el formato —separadores y posición del símbolo—, que es lo que decide
 * `Intl` a partir del tag BCP-47.
 *
 * El parámetro tiene default para que los llamadores que no traducen —el panel
 * admin, sobre todo— sigan compilando sin decidir nada.
 */
export function formatCurrency(amountCents: number, locale: Locale = defaultLocale) {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency: APP_CURRENCY,
  }).format(amountCents / 100);
}

export function getIncludedTax(totalCents: number, taxRate = 0.13) {
  return Math.round(totalCents - totalCents / (1 + taxRate));
}

export function getSubtotalBeforeIncludedTax(totalCents: number, taxRate = 0.13) {
  return totalCents - getIncludedTax(totalCents, taxRate);
}
