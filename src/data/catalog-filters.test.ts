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
