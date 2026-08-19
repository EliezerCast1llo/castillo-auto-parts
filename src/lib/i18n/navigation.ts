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
