import { describe, expect, it } from "vitest";
import { DB_QUERY_FIELDS } from "./catalog-filters";
import { mockProducts } from "./mock-products";
import { SEARCH_SUGGESTIONS } from "./search-suggestions";

/**
 * Reproduce lo que hace la base: `contains` insensible a mayúsculas sobre
 * `DB_QUERY_FIELDS`, sin lematización ni normalización de acentos.
 *
 * Los campos se leen de la constante que arma el `where` de Prisma en vez de
 * repetirlos, así que agregar o quitar uno mueve las dos cosas a la vez.
 */
function matchesLikeTheDatabase(product: (typeof mockProducts)[number], query: string) {
  const needle = query.toLowerCase();

  return DB_QUERY_FIELDS.some((field) =>
    String(product[field] ?? "").toLowerCase().includes(needle),
  );
}

describe("search suggestions", () => {
  // La invariante que importa es de número gramatical: los nombres del catálogo
  // están en singular ("Amortiguador delantero…") y un `contains` literal no
  // los alcanza desde el plural. Antes esto solo lo protegía el e2e, que pide
  // servidor y base; acá falla en milisegundos.
  it.each(SEARCH_SUGGESTIONS)("«$query» encuentra productos ($key)", ({ query }) => {
    const matches = mockProducts.filter((product) => matchesLikeTheDatabase(product, query));

    expect(matches.length, `«${query}» no encuentra ningún producto`).toBeGreaterThan(0);
  });

  it("falla si una sugerencia se escribe en plural", () => {
    // Contraprueba: sin esto, el test de arriba pasaría igual con una regla que
    // no verificara nada. El plural es exactamente el error que se cometió.
    const plurales = mockProducts.filter((product) =>
      matchesLikeTheDatabase(product, "amortiguadores"),
    );

    expect(plurales).toHaveLength(0);
  });

  it("no repite claves ni consultas", () => {
    const keys = SEARCH_SUGGESTIONS.map((suggestion) => suggestion.key);
    const queries = SEARCH_SUGGESTIONS.map((suggestion) => suggestion.query);

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(queries).size).toBe(queries.length);
  });
});
