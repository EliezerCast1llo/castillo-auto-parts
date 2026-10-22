/**
 * Slug canónico a partir de un texto legible.
 *
 * Es la única definición: el seed, el admin y el filtro del catálogo la
 * importan de acá. De eso depende que las URLs viejas se sigan entendiendo —
 * `?category=Frenos` se resuelve a `frenos`, que es la fila que sembró el seed
 * con esta misma función.
 *
 * Quita acentos antes de bajar a minúsculas para que "Suspensión" y
 * "suspension" lleguen al mismo slug.
 *
 * Que `slug === slugifyValue(name)` se sostiene porque los dos caminos que
 * escriben categorías lo derivan del nombre: `prisma/seed.ts` y el
 * `resolveCategoryId` del admin. Una categoría cuyo slug divergiera del nombre
 * no resolvería su URL vieja, pero hoy no hay forma de crearla.
 */
export function slugifyValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
