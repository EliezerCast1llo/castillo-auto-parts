import { describe, expect, it } from "vitest";
import {
  buildCanonicalCatalogQuery,
  buildPrismaWhere,
  countActiveCatalogFilters,
  filterCatalogProducts,
  getCatalogFilterOptions,
  getEmptyCatalogFilters,
  parseCatalogFilters,
  parseCatalogSort,
  stockStatusToPrismaStatuses,
} from "./catalog-filters";
import { mockProducts } from "./mock-products";

describe("catalog filters", () => {
  it("parses repeated query params", () => {
    const filters = parseCatalogFilters({
      category: ["Filtros", "Frenos"],
      q: "toyota",
      stock: "Disponible",
    });

    expect(filters.categories).toEqual(["Filtros", "Frenos"]);
    expect(filters.query).toBe("toyota");
    expect(filters.stockStatuses).toEqual(["IN_STOCK"]);
  });

  it("parses the canonical stock identifiers", () => {
    const filters = parseCatalogFilters({ stock: ["IN_STOCK", "LOW_STOCK"] });
    expect(filters.stockStatuses).toEqual(["IN_STOCK", "LOW_STOCK"]);
  });

  it("still accepts the Spanish stock values shipped in old catalog URLs", () => {
    // `/catalog?stock=Últimas unidades` viajó en la navegación del sitio, así
    // que sigue en historiales, bookmarks y probablemente en el índice.
    expect(parseCatalogFilters({ stock: "Últimas unidades" }).stockStatuses).toEqual(["LOW_STOCK"]);
    expect(parseCatalogFilters({ stock: "No disponible" }).stockStatuses).toEqual(["OUT_OF_STOCK"]);
    expect(parseCatalogFilters({ stock: "ultimas unidades" }).stockStatuses).toEqual(["LOW_STOCK"]);
  });

  it("drops unknown stock values instead of failing", () => {
    expect(parseCatalogFilters({ stock: "agotado" }).stockStatuses).toEqual([]);
  });

  it("deduplicates when a legacy and a canonical value resolve to the same status", () => {
    const filters = parseCatalogFilters({ stock: ["LOW_STOCK", "Últimas unidades"] });
    expect(filters.stockStatuses).toEqual(["LOW_STOCK"]);
  });

  it("builds a canonical query only when a legacy stock value is present", () => {
    expect(buildCanonicalCatalogQuery({ stock: "Últimas unidades" })).toBe("stock=LOW_STOCK");
    expect(buildCanonicalCatalogQuery({ stock: "LOW_STOCK" })).toBeNull();
    expect(buildCanonicalCatalogQuery({ brand: "Bosch" })).toBeNull();
    expect(buildCanonicalCatalogQuery({})).toBeNull();
  });

  it("keeps the other params when canonicalizing a legacy stock value", () => {
    const query = buildCanonicalCatalogQuery({
      brand: ["Bosch", "NGK"],
      q: "toyota",
      stock: "Disponible",
    });

    const params = new URLSearchParams(query ?? "");
    expect(params.getAll("brand")).toEqual(["Bosch", "NGK"]);
    expect(params.get("q")).toBe("toyota");
    expect(params.getAll("stock")).toEqual(["IN_STOCK"]);
  });

  it("does not loop: the canonical result never triggers another redirect", () => {
    const query = buildCanonicalCatalogQuery({ stock: "No disponible" });
    expect(query).toBe("stock=OUT_OF_STOCK");

    const asParams = Object.fromEntries(new URLSearchParams(query ?? ""));
    expect(buildCanonicalCatalogQuery(asParams)).toBeNull();
  });

  it("parses catalog sort safely", () => {
    expect(parseCatalogSort({ sort: "price-asc" })).toBe("price-asc");
    expect(parseCatalogSort({ sort: "unknown" })).toBe("relevance");
    expect(parseCatalogSort({})).toBe("relevance");
  });

  it("filters products by query across sku and part number", () => {
    const filters = parseCatalogFilters({ q: "MOCK-FIL-TOY-18" });
    const products = filterCatalogProducts(mockProducts, filters);

    expect(products).toHaveLength(1);
    expect(products[0]?.slug).toBe("filtro-aceite-toyota-18l");
  });

  it("filters products by compatible vehicle and year", () => {
    const filters = parseCatalogFilters({
      vehicleMake: "Toyota",
      vehicleModel: "Corolla",
      vehicleYear: "2015",
    });
    const products = filterCatalogProducts(mockProducts, filters);
    const slugs = products.map((product) => product.slug);

    // Todos los productos con vehicleCompatibilities que cubren Toyota Corolla 2015
    // deben aparecer. Al expandir el catálogo mock se agregaron más productos
    // compatibles: disco-freno (2014-2022) y bujia-platino (2009-2022).
    expect(slugs).toContain("filtro-aceite-toyota-18l");
    expect(slugs).toContain("disco-freno-delantero-toyota-corolla");
    expect(slugs).toContain("bujia-platino-toyota-corolla-18");
    // Productos universales (sin vehicleCompatibilities) no deben aparecer
    expect(slugs).not.toContain("escobilla-universal-22-pulgadas");
    expect(slugs).not.toContain("refrigerante-premix-1-galon");
  });

  it("uses structured compatibility instead of parsing vehicle text", () => {
    const filters = parseCatalogFilters({
      vehicleMake: "Mercedes Benz",
      vehicleModel: "Clase C",
      vehicleYear: "2018",
    });
    const products = filterCatalogProducts(
      [
        {
          ...mockProducts[0],
          slug: "filtro-mercedes-clase-c",
          compatibleVehicles: ["Mercedes Benz Clase C 2010-2020"],
          vehicleCompatibilities: [
            { make: "Mercedes Benz", model: "Clase C", yearFrom: 2010, yearTo: 2020 },
          ],
        },
      ],
      filters,
    );

    expect(products.map((product) => product.slug)).toEqual(["filtro-mercedes-clase-c"]);
  });

  it("does not match universal products when vehicle filters are active", () => {
    const filters = parseCatalogFilters({ vehicleMake: "Toyota" });
    const products = filterCatalogProducts(mockProducts, filters);

    expect(products.map((product) => product.slug)).not.toContain("escobilla-universal-22-pulgadas");
    expect(products.map((product) => product.slug)).not.toContain("refrigerante-premix-1-galon");
  });

  it("builds catalog filter options from products", () => {
    const options = getCatalogFilterOptions(mockProducts);

    expect(options.categories).toContain("Filtros");
    expect(options.brands).toContain("WIX");
    expect(options.vehicleMakes).toContain("Toyota");
    expect(options.vehicleModelsByMake.Toyota).toContain("Corolla");
    expect(options.vehicleYears).toContain("2022");
  });

  it("builds dependent vehicle year facets by make and make+model", () => {
    const options = getCatalogFilterOptions(mockProducts);

    expect(Object.keys(options.vehicleYearsByMake)).toContain("Toyota");
    expect(options.vehicleYearsByMake.Toyota).toContain("2022");
    // Orden descendente (años recientes primero)
    expect(options.vehicleYearsByMake.Toyota).toEqual(
      [...options.vehicleYearsByMake.Toyota].sort((a, b) => Number(b) - Number(a)),
    );

    const corollaYears = options.vehicleYearsByMakeModel["Toyota::Corolla"];
    expect(corollaYears).toBeDefined();
    expect(corollaYears.every((year) => options.vehicleYearsByMake.Toyota.includes(year))).toBe(
      true,
    );
  });

  it("counts active filters", () => {
    const filters = parseCatalogFilters({
      brand: ["WIX", "NGK"],
      category: "Filtros",
      vehicleMake: "Toyota",
    });

    expect(countActiveCatalogFilters(filters)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// buildPrismaWhere
// ---------------------------------------------------------------------------

describe("buildPrismaWhere", () => {
  it("returns only isActive:true when filters are empty", () => {
    const where = buildPrismaWhere(getEmptyCatalogFilters());

    expect(where).toEqual({ isActive: true });
    expect(where.AND).toBeUndefined();
  });

  it("agrega condición OR de texto cuando query no está vacío", () => {
    const where = buildPrismaWhere({ ...getEmptyCatalogFilters(), query: "toyota" });

    expect(where.AND).toBeDefined();
    const conditions = where.AND as unknown[];
    const textCondition = conditions.find(
      (c): c is { OR: unknown[] } => typeof c === "object" && c !== null && "OR" in c,
    );
    expect(textCondition).toBeDefined();
    expect(textCondition!.OR).toHaveLength(4); // name, sku, partNumber, brand
  });

  it("filtra por categoría con { in: [...] }", () => {
    const where = buildPrismaWhere({
      ...getEmptyCatalogFilters(),
      categories: ["Filtros", "Frenos"],
    });

    const conditions = where.AND as Array<{ category?: { name?: { in?: string[] } } }>;
    const catCondition = conditions.find((c) => c.category !== undefined);
    expect(catCondition?.category?.name?.in).toEqual(["Filtros", "Frenos"]);
  });

  it("filtra por marca con { in: [...] }", () => {
    const where = buildPrismaWhere({
      ...getEmptyCatalogFilters(),
      brands: ["WIX", "NGK"],
    });

    const conditions = where.AND as Array<{ brand?: { in?: string[] } }>;
    const brandCondition = conditions.find((c) => c.brand !== undefined);
    expect(brandCondition?.brand?.in).toEqual(["WIX", "NGK"]);
  });

  it("filtra por stockStatus IN_STOCK → IN_STOCK", () => {
    const where = buildPrismaWhere({
      ...getEmptyCatalogFilters(),
      stockStatuses: ["IN_STOCK"],
    });

    const conditions = where.AND as Array<{ inventoryStocks?: unknown }>;
    const stockCondition = conditions.find((c) => c.inventoryStocks !== undefined);
    expect(stockCondition).toBeDefined();
    expect(stockCondition!.inventoryStocks).toMatchObject({
      some: { status: { in: ["IN_STOCK"] } },
    });
  });

  it("filtra por stockStatus OUT_OF_STOCK → OUT_OF_STOCK y PREORDER", () => {
    const where = buildPrismaWhere({
      ...getEmptyCatalogFilters(),
      stockStatuses: ["OUT_OF_STOCK"],
    });

    const conditions = where.AND as Array<{ inventoryStocks?: unknown }>;
    const stockCondition = conditions.find((c) => c.inventoryStocks !== undefined);
    expect(stockCondition!.inventoryStocks).toMatchObject({
      some: { status: { in: expect.arrayContaining(["OUT_OF_STOCK", "PREORDER"]) } },
    });
  });

  it("filtra por vehículo con make, model y rango de años", () => {
    const where = buildPrismaWhere({
      ...getEmptyCatalogFilters(),
      vehicleMake: "Toyota",
      vehicleModel: "Corolla",
      vehicleYear: "2015",
    });

    const conditions = where.AND as Array<{ compatibilities?: unknown }>;
    const vehicleCondition = conditions.find((c) => c.compatibilities !== undefined);
    expect(vehicleCondition!.compatibilities).toMatchObject({
      some: {
        make: { equals: "Toyota", mode: "insensitive" },
        model: { equals: "Corolla", mode: "insensitive" },
        yearFrom: { lte: 2015 },
        yearTo: { gte: 2015 },
      },
    });
  });

  it("ignora vehicleYear no numérico", () => {
    const where = buildPrismaWhere({
      ...getEmptyCatalogFilters(),
      vehicleMake: "Toyota",
      vehicleYear: "abc",
    });

    const conditions = where.AND as Array<{ compatibilities?: unknown }>;
    const vehicleCondition = conditions.find((c) => c.compatibilities !== undefined);
    // El vehículo se agrega (por make), pero sin yearFrom/yearTo
    expect(vehicleCondition!.compatibilities).toMatchObject({
      some: { make: { equals: "Toyota", mode: "insensitive" } },
    });
    expect((vehicleCondition!.compatibilities as { some: Record<string, unknown> }).some.yearFrom).toBeUndefined();
  });

  it("combina múltiples filtros con AND", () => {
    const where = buildPrismaWhere({
      ...getEmptyCatalogFilters(),
      query: "filtro",
      categories: ["Filtros"],
      brands: ["WIX"],
    });

    const conditions = where.AND as unknown[];
    expect(conditions).toHaveLength(3); // query + category + brand
  });
});

// ---------------------------------------------------------------------------
// stockStatusToPrismaStatuses
// ---------------------------------------------------------------------------

describe("stockStatusToPrismaStatuses", () => {
  it("convierte IN_STOCK → IN_STOCK", () => {
    expect(stockStatusToPrismaStatuses("IN_STOCK")).toEqual(["IN_STOCK"]);
  });

  it("convierte LOW_STOCK → LOW_STOCK", () => {
    expect(stockStatusToPrismaStatuses("LOW_STOCK")).toEqual(["LOW_STOCK"]);
  });

  it("convierte OUT_OF_STOCK → OUT_OF_STOCK y PREORDER", () => {
    expect(stockStatusToPrismaStatuses("OUT_OF_STOCK")).toEqual(["OUT_OF_STOCK", "PREORDER"]);
  });
});
