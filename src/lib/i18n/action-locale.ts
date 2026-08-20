import "server-only";
import { cookies, headers } from "next/headers";
import { defaultLocale, type Locale } from "./config";
import { isLocale } from "./params";
import { LOCALE_COOKIE } from "./routing";

/**
 * Idioma dentro de una server action.
 *
 * Una action no tiene segmento de ruta del que deducir el idioma, y `getLocale()`
 * ahí devuelve el idioma por defecto en vez de admitir que no sabe. El efecto no
 * es un texto mal traducido sino un **destino equivocado**: quien navegaba en
 * `/en/auth/login` y erraba la contraseña terminaba en `/es/auth/login`, con el
 * mensaje correcto pero en el otro idioma.
 *
 * La fuente es el `Referer`, que en una action apunta a la página desde la que
 * se envió el formulario y por lo tanto lleva el prefijo de idioma. Es fiable
 * acá porque el POST es del mismo origen y `next.config.ts` declara
 * `Referrer-Policy: strict-origin-when-cross-origin`, que en ese caso manda la
 * URL completa.
 *
 * La cookie queda como respaldo por si el `Referer` viniera recortado. No al
 * revés: en la práctica el `Referer` llega y la cookie puede no estar.
 *
 * Es la misma regla que el resto de la app —el idioma se toma de una fuente
 * explícita, no se deduce—; lo que cambia es cuál es la fuente disponible.
 */
export async function getActionLocale(): Promise<Locale> {
  const fromReferer = localeFromReferer((await headers()).get("referer"));
  if (fromReferer) return fromReferer;

  const cookieValue = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (cookieValue && isLocale(cookieValue)) return cookieValue;

  return defaultLocale;
}

function localeFromReferer(referer: string | null): Locale | null {
  if (!referer) return null;

  try {
    const [, segment] = new URL(referer).pathname.split("/");
    return segment && isLocale(segment) ? segment : null;
  } catch {
    // Un `Referer` malformado no debería tumbar la acción.
    return null;
  }
}
