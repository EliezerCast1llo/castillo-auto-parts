import type { Locale } from "../config";
import en from "./en";
import es from "./es";

/**
 * Catálogo de un idioma.
 *
 * Los dos catálogos se importan estáticamente: son server-only y el cliente
 * recibe solo el subconjunto que arma `pickClientMessages`, así que no hay nada
 * que separar en chunks y un `await import()` sería ceremonia sin beneficio.
 */
export function loadMessages(locale: Locale) {
  return locale === "en" ? en : es;
}

/**
 * Namespaces que necesitan los componentes de cliente.
 *
 * `NextIntlClientProvider` manda al navegador lo que se le pase, así que pasarle
 * el catálogo entero significaría enviar todos los mensajes del sitio en cada
 * página. Los server components leen del contexto de servidor y no cuestan
 * nada, así que acá va solo lo que se usa desde `"use client"`.
 *
 * Al agregar un namespace nuevo a un componente de cliente, hay que sumarlo acá.
 */
const CLIENT_NAMESPACES = ["Common", "Consent"] as const;

export function pickClientMessages<T extends Record<string, unknown>>(messages: T) {
  return Object.fromEntries(
    CLIENT_NAMESPACES.filter((namespace) => namespace in messages).map((namespace) => [
      namespace,
      messages[namespace],
    ]),
  );
}
