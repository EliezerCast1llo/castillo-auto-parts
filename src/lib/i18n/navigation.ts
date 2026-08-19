import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Reemplazos de `next/link` y `next/navigation` que conocen el idioma.
 *
 * Cuando el árbol de rutas se mueva bajo `[locale]`, los componentes del
 * storefront deben importar de acá en vez de `next/link` / `next/navigation`:
 * estos helpers agregan el prefijo de idioma solos. El panel `/admin` queda
 * fuera del prefijo, así que sigue usando los de Next.
 */
export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * Destino aceptado por el `Link` y el `redirect` con idioma.
 */
export type LocaleHref = Parameters<typeof getPathname>[0]["href"];

/**
 * Convierte una ruta validada en runtime al tipo de href.
 *
 * El destino post-login sale del query param `?next=`: lo controla el usuario y
 * se valida por prefijo en `getSafeCustomerNextPath`, no por tipo. El cast vive
 * acá, con su justificación, en vez de repetido en cada punto de uso.
 */
export function asLocaleHref(path: string): LocaleHref {
  return path as LocaleHref;
}
