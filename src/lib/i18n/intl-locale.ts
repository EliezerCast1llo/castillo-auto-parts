import type { Locale } from "./config";

/**
 * Única fuente de tags BCP-47. Ningún otro módulo debe hardcodear "es-SV".
 *
 * El negocio está en El Salvador: la moneda es USD en ambos idiomas y la zona
 * horaria es America/El_Salvador en ambos. Lo único que cambia con el idioma es
 * cómo se formatean fechas y números.
 */
const INTL_LOCALES: Record<Locale, string> = {
  es: "es-SV",
  en: "en-US",
};

export const APP_TIME_ZONE = "America/El_Salvador";

/** El Salvador está dolarizado: la moneda no cambia con el idioma. */
export const APP_CURRENCY = "USD";

export function toIntlLocale(locale: Locale): string {
  return INTL_LOCALES[locale];
}
