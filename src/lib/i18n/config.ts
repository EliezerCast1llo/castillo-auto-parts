export const locales = ["es", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

/**
 * Idiomas cuyo contenido ya está traducido y por lo tanto se ofrece a los
 * buscadores.
 *
 * El sitio se sirve en los dos idiomas desde que existe el ruteo, pero el copy
 * en inglés llega después. Mientras tanto `/en/*` renderiza texto en español
 * bajo `lang="en"`: indexarlo sería publicar contenido duplicado en el idioma
 * equivocado, que es peor que no tener versión en inglés.
 *
 * Por eso las rutas de un idioma no publicado salen con `robots: noindex` y no
 * entran al sitemap. Siguen navegables y siguen emitiendo `hreflang`, así que
 * quien elija inglés lo ve; solo no se le ofrece a Google.
 *
 * **Agregar un idioma acá es el último paso de su traducción, no el primero.**
 */
export const publishedLocales: readonly Locale[] = [defaultLocale];

export function isPublishedLocale(locale: Locale): boolean {
  return publishedLocales.includes(locale);
}
