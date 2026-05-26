/**
 * Utilidades para leer y normalizar valores de FormData en Server Actions.
 *
 * Antes estaban duplicadas como funciones locales privadas en cada
 * actions.ts. Centralizarlas aquí elimina la duplicación y garantiza
 * comportamiento consistente en toda la app.
 */

/**
 * Lee un campo de FormData como string recortado.
 * Retorna string vacío si el campo no existe o no es string.
 */
export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Lee un campo de FormData como string recortado.
 * Retorna `undefined` si el campo está vacío o ausente.
 * Usado en lógica de dominio donde undefined tiene semántica de "no provisto".
 */
export function optionalFormString(
  formData: FormData,
  key: string,
): string | undefined {
  return formString(formData, key) || undefined;
}

/**
 * Lee un campo de FormData como string recortado.
 * Retorna `null` si el campo está vacío o ausente.
 * Usado en acciones de admin donde null se persiste en la base de datos.
 */
export function optionalFormStringOrNull(
  formData: FormData,
  key: string,
): string | null {
  return formString(formData, key) || null;
}
