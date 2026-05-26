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
