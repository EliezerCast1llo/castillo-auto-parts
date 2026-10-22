/**
 * Utilidades para leer y normalizar parámetros de URL (searchParams).
 *
 * Next.js App Router puede entregar searchParams como `string`,
 * `string[]` o `undefined`. Estas helpers normalizan esos casos.
 */

/**
 * Retorna el primer valor de un searchParam, o string vacío si no existe.
 * Útil para params que solo esperan un valor único (estado, q, next, etc.).
 */
export function firstValue(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Retorna todos los valores de un searchParam como array de strings.
 * Filtra valores vacíos y los recorta.
 */
export function allValues(
  value: string | string[] | undefined,
): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values
    .filter((item): item is string => Boolean(item))
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Query serializable que aceptan el `Link` y el `redirect` con idioma. */
export type LinkQuery = Record<string, string | string[]>;

/**
 * Convierte `URLSearchParams` en el objeto `query` que espera la navegación con
 * idioma.
 *
 * **No usar `Object.fromEntries`**: se queda con el último valor de cada clave
 * repetida. Los filtros del catálogo son multi-selección —categoría, marca y
 * estado de stock— así que aplanarlo así hace que marcar dos categorías navegue
 * con una sola, y que quitar un filtro descarte los demás del mismo tipo.
 */
export function toLinkQuery(params: URLSearchParams): LinkQuery {
  const query: LinkQuery = {};

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    query[key] = values.length > 1 ? values : values[0];
  }

  return query;
}
