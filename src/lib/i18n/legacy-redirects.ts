import { defaultLocale, locales } from "./config";

/**
 * Rutas que nunca pasan por el ruteo de idiomas.
 *
 * `/admin` es el panel interno, que vive sin prefijo. El resto son endpoints y
 * assets que no renderizan HTML.
 */
const BYPASS_PREFIXES = ["/admin", "/api", "/_next", "/_vercel", "/.well-known"];

/** Los archivos con extensión no son páginas: robots.txt, sitemap.xml, imágenes. */
const FILE_EXTENSION = /\.[a-z0-9]+$/i;

export function isBypassedPath(pathname: string): boolean {
  return BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function hasLocalePrefix(pathname: string): boolean {
  return locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

/**
 * Traduce una URL vieja sin prefijo de idioma a su equivalente en español.
 *
 * Devuelve `null` cuando no hay nada que migrar, que es también la guarda
 * contra el loop: una URL ya prefijada nunca vuelve a redirigir.
 *
 * `/` queda deliberadamente fuera. Es la única URL donde interesa negociar el
 * idioma con `Accept-Language`, y next-intl la resuelve con un 307 que lleva
 * `Vary`. Mandarla acá la convertiría en un permanente cacheado por URL, que
 * dejaría clavado en español a quien llegue en inglés.
 *
 * El resto sí va a español de forma permanente: son URLs ya indexadas que hoy
 * sirven contenido en español, así que ese es el destino honesto. El inglés se
 * descubre por `hreflang` y por el selector de idioma.
 */
export function resolveLegacyRedirect(url: URL): URL | null {
  const { pathname } = url;

  if (pathname === "/") return null;
  if (hasLocalePrefix(pathname)) return null;
  if (isBypassedPath(pathname)) return null;
  if (FILE_EXTENSION.test(pathname)) return null;

  const target = new URL(url.toString());
  target.pathname = `/${defaultLocale}${pathname}`;

  return target;
}
