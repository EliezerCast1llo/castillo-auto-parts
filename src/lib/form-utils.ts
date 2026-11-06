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

/**
 * Lee una casilla de verificación acompañada de un campo oculto.
 *
 * El par es necesario porque una casilla sin marcar **no manda nada**: sin el
 * oculto, apagarla sería indistinguible de no haber enviado el formulario.
 *
 * Y `getAll` y no `get` porque `get` devuelve el **primer** valor: con el
 * oculto escrito antes de la casilla —que es como está en el panel— marcarla
 * no servía de nada y el campo se guardaba siempre apagado. Mirando todos los
 * valores, el orden en el HTML deja de importar.
 */
export function formCheckbox(formData: FormData, key: string): boolean {
  return formData.getAll(key).includes("true");
}
