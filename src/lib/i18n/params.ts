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
  return isLocale(locale) ? locale : defaultLocale;
}
