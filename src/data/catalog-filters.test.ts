import { describe, expect, it } from "vitest";
import {
  countActiveCatalogFilters,
  filterCatalogProducts,
  getCatalogFilterOptions,
  parseCatalogFilters,
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

    expect(products.map((product) => product.slug)).toEqual(["filtro-aceite-toyota-18l"]);
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
