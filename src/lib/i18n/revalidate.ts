import { revalidatePath } from "next/cache";

/**
 * `revalidatePath` para rutas del storefront, que viven bajo `[locale]`.
 *
 * Pasar el patrón dinámico junto con el tipo revalida **todos** los idiomas de
 * una sola llamada; pasar `/cart` a secas no invalidaría nada, porque esa ruta
 * ya no existe sin prefijo.
 */
export function revalidateStorefrontPath(path: string) {
  const normalized = path === "/" ? "" : path;
  revalidatePath(`/[locale]${normalized}`, "page");
}
