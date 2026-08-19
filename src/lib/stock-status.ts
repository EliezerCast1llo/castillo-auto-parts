/**
 * Estado de stock a nivel de aplicación.
 *
 * Es un identificador de dominio, NO un texto para el usuario: viaja en query
 * params (`/catalog?stock=LOW_STOCK`), se usa como clave de objetos y alimenta
 * el mapeo a schema.org. Los textos visibles salen de `stockStatusLabels` y en
 * su momento pasarán al catálogo de mensajes i18n.
 *
 * Antes de este módulo los valores eran strings en español ("Disponible",
 * "Últimas unidades", "No disponible"), lo que hacía imposible traducir la UI
 * sin romper filtros y JSON-LD. `parseStockStatusParam` mantiene compatibilidad
 * con las URLs viejas que quedaron en historiales, bookmarks y buscadores.
 *
 * Módulo puro: sin imports de Prisma ni de next/*, así que puede usarse desde
 * componentes de cliente. La traducción a `InventoryStatus` de Prisma vive en
 * `src/data/catalog-filters.ts`.
 */

/** Orden de presentación en los filtros del catálogo. */
export const stockStatuses = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const;

export type StockStatus = (typeof stockStatuses)[number];

/** Etiquetas en español. Se moverán al catálogo de mensajes con el i18n. */
export const stockStatusLabels: Record<StockStatus, string> = {
  IN_STOCK: "Disponible",
  LOW_STOCK: "Últimas unidades",
  OUT_OF_STOCK: "No disponible",
};

export function isStockStatus(value: string): value is StockStatus {
  return stockStatuses.some((status) => status === value);
}

export function formatStockStatus(status: StockStatus) {
  return stockStatusLabels[status];
}

/**
 * Valores en español que la app sirvió antes del refactor, normalizados sin
 * acentos ni mayúsculas. `src/lib/nav.ts` publicaba
 * `/catalog?stock=Últimas unidades` en la navegación del sitio, así que esas
 * URLs siguen circulando.
 */
const LEGACY_STOCK_STATUS: Record<string, StockStatus> = {
  disponible: "IN_STOCK",
  "ultimas unidades": "LOW_STOCK",
  "no disponible": "OUT_OF_STOCK",
};

/**
 * Acepta el identificador canónico o cualquiera de los valores españoles
 * legacy. Devuelve `null` si el valor no corresponde a ningún estado conocido.
 */
export function parseStockStatusParam(value: string): StockStatus | null {
  const trimmed = value.trim();
  if (isStockStatus(trimmed)) return trimmed;

  return LEGACY_STOCK_STATUS[normalizeStockStatusValue(trimmed)] ?? null;
}

/** true si `value` es un valor legacy en español y no el identificador canónico. */
export function isLegacyStockStatusParam(value: string): boolean {
  const trimmed = value.trim();
  if (isStockStatus(trimmed)) return false;
  return normalizeStockStatusValue(trimmed) in LEGACY_STOCK_STATUS;
}

function normalizeStockStatusValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
