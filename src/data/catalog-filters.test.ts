import { describe, expect, it } from "vitest";
import {
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
    expect(filters.stockStatuses).toEqual(["Disponible"]);
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

  it("filtra por stockStatus Disponible → IN_STOCK", () => {
    const where = buildPrismaWhere({
      ...getEmptyCatalogFilters(),
      stockStatuses: ["Disponible"],
    });

    const conditions = where.AND as Array<{ inventoryStocks?: unknown }>;
    const stockCondition = conditions.find((c) => c.inventoryStocks !== undefined);
    expect(stockCondition).toBeDefined();
    expect(stockCondition!.inventoryStocks).toMatchObject({
      some: { status: { in: ["IN_STOCK"] } },
    });
  });

  it("filtra por stockStatus No disponible → OUT_OF_STOCK y PREORDER", () => {
    const where = buildPrismaWhere({
      ...getEmptyCatalogFilters(),
      stockStatuses: ["No disponible"],
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
  it("convierte Disponible → IN_STOCK", () => {
    expect(stockStatusToPrismaStatuses("Disponible")).toEqual(["IN_STOCK"]);
  });

  it("convierte Últimas unidades → LOW_STOCK", () => {
    expect(stockStatusToPrismaStatuses("Últimas unidades")).toEqual(["LOW_STOCK"]);
  });

  it("convierte No disponible → OUT_OF_STOCK y PREORDER", () => {
    expect(stockStatusToPrismaStatuses("No disponible")).toEqual(["OUT_OF_STOCK", "PREORDER"]);
  });
});
