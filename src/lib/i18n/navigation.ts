import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Reemplazos de `next/link` y `next/navigation` que conocen el idioma.
 *
 * Los componentes del storefront importan de acá: estos helpers agregan el
 * prefijo de idioma solos. El panel `/admin` queda fuera del prefijo, así que
 * sigue usando los de Next.
 */
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * Destino aceptado por el `Link` y el `redirect` con idioma.
 *
 * Con `pathnames` configurado deja de ser un string libre: es la unión de las
 * rutas declaradas, más la forma `{ pathname, params, query }` para las rutas
 * dinámicas y para cualquier URL con query string. Es más ruidoso de escribir,
 * pero un href inexistente ya no compila.
 */
export type LocaleHref = Parameters<typeof getPathname>[0]["href"];

/**
 * Convierte una ruta validada en runtime al tipo de href.
 *
 * Con `pathnames` el href es una unión cerrada de rutas conocidas, pero el
 * destino post-login sale del query param `?next=`: lo controla el usuario y se
 * valida por prefijo en `getSafeCustomerNextPath`, no por tipo. El cast vive
 * acá, con su justificación, en vez de repetido en cada punto de uso.
 */
export function asLocaleHref(path: string): LocaleHref {
  return path as LocaleHref;
}
