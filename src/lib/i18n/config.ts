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
 *
 * `en` entró cuando el catálogo quedó completo: 551 claves, 542 traducidas y 9
 * legítimamente idénticas —la marca, "Subtotal", "Email", "SKU", "El Salvador"—.
 * Tres pruebas lo sostienen y corren en CI: `messages.test.ts` verifica paridad
 * de claves y que ninguna quede sin traducir, `hardcoded-copy.test.ts` que no
 * haya texto de interfaz escrito a mano, e `i18n.spec.ts` que lo traducido
 * llegue a la pantalla en los dos idiomas.
 */
export const publishedLocales: readonly Locale[] = locales;

export function isPublishedLocale(locale: Locale): boolean {
  return publishedLocales.includes(locale);
}
