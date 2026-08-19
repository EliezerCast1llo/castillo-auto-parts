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
 * **Solo es válido para rutas cuya grafía no cambia con el idioma.** Hoy ninguna
 * cambia: no hay tabla de pathnames. En cuanto se agregue una, las rutas que
 * pasen por acá —los breadcrumbs y la URL de retorno del pago— tienen que
 * seguir teniendo la misma grafía en todos los idiomas, o hay que moverlas a
 * `getPathname`, que sí consulta la tabla.
 */
export function localizePath(path: string, locale: Locale): string {
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}
