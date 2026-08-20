import { setRequestLocale } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Idioma de una ruta bajo `[locale]`.
 *
 * Next tipa `params.locale` como `string`, así que declarar la unión angosta en
 * la firma de una página o un layout no satisface sus tipos generados. Se toma
 * el string y se estrecha acá.
 *
 * Sale de los params y no de `getLocale()` a propósito: en un layout anidado
 * ese helper no resuelve el segmento y cae al idioma por defecto, que es
 * exactamente cómo los guards de `/account` terminaban mandando a todo el mundo
 * al login en español.
 */
export async function resolveRouteLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  const resolved = isLocale(locale) ? locale : defaultLocale;

  // Además de estrechar el tipo, publica el idioma para el resto del subárbol:
  // es de donde `getTranslations` y `getLocale` lo leen. El cache que usa
  // next-intl es el `cache()` de React, que vive por pase de render, y el orden
  // entre el layout y la página no está garantizado: si solo lo publicara el
  // layout, los componentes que renderiza la página verían el idioma por
  // defecto. Por eso cada página que traduce tiene que llamar a esta función.
  setRequestLocale(resolved);

  return resolved;
}
