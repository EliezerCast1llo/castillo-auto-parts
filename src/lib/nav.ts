import type { LocaleHref } from "@/lib/i18n/navigation";
import type esMessages from "@/lib/i18n/messages/es";

/** Claves del namespace `Nav`: un item sin su mensaje no compila. */
type NavKey = keyof typeof esMessages.Nav;

/**
 * Navegación principal — única fuente para headers (default/hero) y menú móvil.
 *
 * El item guarda la **clave** del mensaje, no el texto: quien renderiza traduce.
 * Así la lista sigue siendo un módulo puro, sin dependencia de next-intl, y se
 * puede seguir importando desde cualquier capa.
 */
export const siteNavItems: { key: NavKey; href: LocaleHref }[] = [
  { key: "catalog", href: "/catalog" },
  { key: "brands", href: { pathname: "/catalog", query: { brand: "Bosch" } } },
  { key: "deals", href: { pathname: "/catalog", query: { stock: "LOW_STOCK" } } },
  // La ruta interna se llama `/help`; en español se sirve como `/ayuda`.
  { key: "help", href: "/help" },
];
