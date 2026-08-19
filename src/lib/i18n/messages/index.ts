import type { Locale } from "../config";
import en from "./en";
import es from "./es";

/**
 * Catálogo de un idioma.
 *
 * Los dos catálogos se importan estáticamente: son server-only, así que no hay
 * nada que separar en chunks y un `await import()` sería ceremonia sin
 * beneficio.
 */
export function loadMessages(locale: Locale) {
  return locale === "en" ? en : es;
}
