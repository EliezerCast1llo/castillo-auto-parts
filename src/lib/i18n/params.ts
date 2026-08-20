import { setRequestLocale } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Idioma de una ruta bajo `[locale]`, publicado para el resto del subárbol.
 *
 * Hace dos cosas y las dos hacen falta juntas, por eso el nombre las nombra:
 *
 * 1. **Resuelve.** Next tipa `params.locale` como `string`, así que declarar la
 *    unión angosta en la firma de una página no satisface sus tipos generados.
 *    Se toma el string y se estrecha acá.
 * 2. **Publica.** `setRequestLocale` deja el idioma disponible para el resto
 *    del render. El cache que usa next-intl es el `cache()` de React, que vive
 *    por pase de render, y el orden entre el layout y la página no está
 *    garantizado: si solo lo publicara el layout, los componentes que renderiza
 *    la página verían el idioma por defecto.
 *
 * Sale de los params y no de `getLocale()` a propósito: en un layout anidado ese
 * helper no resuelve el segmento y cae al idioma por defecto en silencio, que es
 * como los guards de `/account` terminaban mandando a todos al login en español.
 *
 * Aun con esto publicado, los componentes reciben el idioma por props: la
 * publicación es la red, no el mecanismo. Una página que no traduce nada no
 * necesita llamar a esta función.
 */
export async function resolveAndPublishRouteLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  const resolved = isLocale(locale) ? locale : defaultLocale;

  setRequestLocale(resolved);

  return resolved;
}
