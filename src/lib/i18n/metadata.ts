import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "./config";
import { getPathname } from "./navigation";

type Href = Parameters<typeof getPathname>[0]["href"];

/**
 * `alternates` de una ruta del storefront: canonical al idioma actual y
 * `hreflang` hacia el resto.
 *
 * Existe por dos razones, y las dos muerden si se ignoran:
 *
 * 1. El canonical **tiene que llevar el prefijo de idioma**. Uno sin prefijo
 *    resuelve contra `metadataBase` a una URL que el middleware redirige, así
 *    que `/es/catalog` y `/en/catalog` declararían el mismo canonical y Google
 *    leería la versión en inglés como duplicado de una URL que ni siquiera
 *    responde 200.
 * 2. **Next mergea metadata de forma superficial.** Un hijo que declara
 *    `alternates` reemplaza el objeto entero del layout, `languages` incluido.
 *    Declarar solo el canonical borraría los `hreflang` justo en las páginas
 *    indexables. Por eso el canonical y los idiomas se emiten siempre juntos,
 *    desde acá.
 *
 * Un clúster de `hreflang` cuyos miembros canonicalizan a otra URL, Google lo
 * descarta entero: los dos puntos son en realidad el mismo requisito.
 */
export function localizedAlternates(href: Href, locale: Locale): Metadata["alternates"] {
  return {
    canonical: getPathname({ href, locale }),
    languages: {
      ...Object.fromEntries(locales.map((item) => [item, getPathname({ href, locale: item })])),
      "x-default": getPathname({ href, locale: defaultLocale }),
    },
  };
}
