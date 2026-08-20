/**
 * Slug canónico a partir de un texto legible.
 *
 * Es la misma regla que usa `prisma/seed.ts` para sembrar
 * `ProductCategory.slug`, y de eso depende que las URLs viejas se sigan
 * entendiendo: `?category=Frenos` se resuelve a `frenos`, que es la fila que
 * existe en la base. Si las dos reglas se separan, los links compartidos dejan
 * de encontrar la categoría en silencio.
 *
 * Quita acentos antes de bajar a minúsculas para que "Suspensión" y
 * "suspension" lleguen al mismo slug.
 */
export function slugifyValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
