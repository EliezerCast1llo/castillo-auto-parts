import type { Locale } from "../config";
import en from "./en";
import es from "./es";

/**
 * Carga el catálogo de un idioma con imports estáticos.
 *
 * A propósito no usa `import(\`./${locale}\`)`: el specifier con template
 * literal obliga al bundler a adivinar y complica el tree-shaking. Con dos
 * idiomas, un `if` es más barato y más claro.
 */
export async function loadMessages(locale: Locale) {
  if (locale === "en") {
    return (await import("./en")).default;
  }
  return (await import("./es")).default;
}

/** Acceso síncrono, para tests y para cualquier chequeo de paridad. */
export const messagesByLocale = { en, es } satisfies Record<Locale, unknown>;
