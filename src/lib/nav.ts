import type { LocaleHref } from "@/lib/i18n/navigation";

/** Navegación principal — única fuente para headers (default/hero) y menú móvil. */
export const siteNavItems: { label: string; href: LocaleHref }[] = [
  { label: "Catálogo", href: "/catalog" },
  { label: "Marcas", href: { pathname: "/catalog", query: { brand: "Bosch" } } },
  { label: "Ofertas", href: { pathname: "/catalog", query: { stock: "LOW_STOCK" } } },
  // La ruta interna se llama `/help`; en español se sirve como `/ayuda`.
  { label: "Ayuda", href: "/help" },
];
