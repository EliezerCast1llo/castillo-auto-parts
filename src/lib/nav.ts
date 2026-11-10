import type { LocaleHref } from "@/lib/i18n/navigation";
import type esMessages from "@/lib/i18n/messages/es";

/** Claves del namespace `Nav`: un item sin su mensaje no compila. */
export type SiteNavKey = Extract<keyof typeof esMessages.Nav, "catalog" | "brands" | "lastUnits" | "help">;

/**
 * Navegación principal — única fuente para headers (default/hero) y menú móvil.
 *
 * El item guarda la **clave** del mensaje, no el texto: quien renderiza traduce.
 * Así la lista sigue siendo un módulo puro, sin dependencia de next-intl, y se
 * puede seguir importando desde cualquier capa.
 */
export const siteNavItems: { key: SiteNavKey; href: LocaleHref }[] = [
  { key: "catalog", href: "/catalog" },
  { key: "brands", href: "/catalog" },
  { key: "lastUnits", href: { pathname: "/catalog", query: { stock: "LOW_STOCK" } } },
  // La ruta interna se llama `/help`; en español se sirve como `/ayuda`.
  { key: "help", href: "/help" },
];
