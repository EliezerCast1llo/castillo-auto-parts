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
 * El tipo se ata a las claves del catálogo en español: un namespace mal escrito
 * o renombrado no compila, en vez de convertirse en un `MISSING_MESSAGE` en
 * runtime lejos de la causa.
 *
 * `Account`, `Cart` y `Checkout` entran porque el modal de dirección, el
 * stepper de cantidad, el form de agregar al carrito y los campos de entrega
 * son componentes de cliente. Es la parte
 * cara de la lista y por eso los mensajes de `?estado=` no entran con ellos: se
 * resuelven en el servidor y bajan como texto, que es lo que deja fuera al
 * namespace `Status` entero.
 */
const CLIENT_NAMESPACES = [
  "Account",
  "Auth",
  "Cart",
  "Checkout",
  "Common",
  "Consent",
  "Errors",
  "Nav",
  "VehicleSearch",
] as const satisfies readonly (keyof typeof es)[];

export function pickClientMessages(messages: typeof es | typeof en) {
  return Object.fromEntries(
    CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]),
  );
}
