import type { Locale } from "./config";

/**
 * Antepone el prefijo de idioma a una ruta interna.
 *
 * Existe además de `getPathname` porque este módulo es puro: no importa
 * `next-intl/navigation`, que a su vez arrastra `next/navigation`. Eso permite
 * usarlo desde capas que no son React —dominio, emails, JSON-LD— y que se
 * testean en el entorno `node` de vitest, donde esa cadena de imports no
 * resuelve.
 *
 * **Solo es válido para rutas cuya grafía no cambia con el idioma.** Las que sí
 * cambian tienen que pasar por `getPathname`, que consulta la tabla de
 * pathnames. `LOCALIZE_PATH_ROUTES` lista las que dependen de este helper y un
 * test de la configuración de ruteo verifica que ninguna esté localizada.
 */
export function localizePath(path: string, locale: Locale): string {
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

/**
 * Rutas que hoy se arman con `localizePath`: los breadcrumbs y el `url` del
 * JSON-LD, más la URL de retorno del pago.
 *
 * Vive acá y no en el test para que quien agregue un consumidor nuevo lo sume
 * en el mismo archivo donde está la restricción. Si alguna de estas rutas se
 * localiza, el test de ruteo falla y hay que moverla a `getPathname`.
 */
export const LOCALIZE_PATH_ROUTES = [
  "/",
  "/catalog",
  "/product/[slug]",
  "/orders/[orderNumber]",
] as const;
