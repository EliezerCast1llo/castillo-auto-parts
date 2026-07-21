/**
 * Identidad pública del sitio, compartida por metadata, sitemap, robots,
 * JSON-LD y OG images. Única fuente de verdad para URL/nombre/descripción.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://castilloautoparts.com";

export const SITE_NAME = "Castillo Auto Parts";

export const SITE_DESCRIPTION =
  "Repuestos automotrices para El Salvador. Catálogo con compatibilidad verificada, stock en tiempo real y entrega en San Salvador y Santa Tecla.";
