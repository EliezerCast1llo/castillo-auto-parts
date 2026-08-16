/**
 * Identidad pública del sitio, compartida por metadata, sitemap, robots,
 * JSON-LD y OG images. Única fuente de verdad para URL/nombre/descripción.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://castilloautoparts.com";

export const SITE_NAME = "Castillo Auto Parts";

export const SITE_DESCRIPTION =
  "Encuentra repuestos automotrices para tu vehículo. Filtra por marca, modelo, año o número de parte y consulta opciones de entrega local.";
