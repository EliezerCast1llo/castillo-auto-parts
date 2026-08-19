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
 * **Solo es válido para rutas cuya grafía no cambia con el idioma.** Para las
 * que sí cambian hay que usar `getPathname`, que consulta la tabla de
 * pathnames. Un test de la configuración de ruteo fija esa condición para las
 * rutas que dependen de este helper.
 */
export function localizePath(path: string, locale: Locale): string {
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}
