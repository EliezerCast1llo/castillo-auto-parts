import type { InventoryStatus, Prisma } from "@prisma/client";
import {
  isLegacyStockStatusParam,
  parseStockStatusParam,
  stockStatuses,
  type StockStatus,
} from "@/lib/stock-status";
import type { CatalogProduct } from "./products";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

export type CatalogFilters = {
  query: string;
  categories: string[];
  brands: string[];
  stockStatuses: CatalogProduct["stockStatus"][];
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
};

export type CatalogFilterOptions = {
  categories: string[];
  brands: string[];
  /** Productos activos por categoría/marca; alimenta los "(n)" de la UI. */
  categoryCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  stockStatuses: CatalogProduct["stockStatus"][];
  vehicleMakes: string[];
  vehicleModels: string[];
  vehicleModelsByMake: Record<string, string[]>;
  vehicleYears: string[];
  vehicleYearsByMake: Record<string, string[]>;
  vehicleYearsByMakeModel: Record<string, string[]>;
};

/** Clave de vehicleYearsByMakeModel: separa make y model sin ambigüedad. */
export function vehicleMakeModelKey(make: string, model: string) {
  return `${make}::${model}`;
}

export type CatalogSort = "relevance" | "price-asc" | "price-desc" | "newest";

export const catalogSortOptions: { label: string; value: CatalogSort }[] = [
  { label: "Relevancia", value: "relevance" },
  { label: "Precio: menor a mayor", value: "price-asc" },
  { label: "Precio: mayor a menor", value: "price-desc" },
  { label: "Más nuevos", value: "newest" },
];

/** Orden de presentación de los filtros de stock. */
export const stockStatusOrder: readonly StockStatus[] = stockStatuses;

export function parseCatalogFilters(searchParams: CatalogSearchParams): CatalogFilters {
  return {
    query: firstValue(searchParams.q),
    categories: valuesFor(searchParams.category),
    brands: valuesFor(searchParams.brand),
    stockStatuses: parseStockStatusParams(searchParams.stock),
    vehicleMake: firstValue(searchParams.vehicleMake),
    vehicleModel: firstValue(searchParams.vehicleModel),
    vehicleYear: firstValue(searchParams.vehicleYear),
  };
}

/**
 * Si el query param `stock` trae valores en español legacy, devuelve el query
 * string canónico para redirigir; `null` cuando no hay nada que migrar.
 *
 * El `null` es la guarda contra el loop: después del redirect los valores ya son
 * identificadores canónicos, así que la segunda pasada no vuelve a disparar.
 */
export function buildCanonicalCatalogQuery(searchParams: CatalogSearchParams): string | null {
  const rawStock = valuesFor(searchParams.stock);
  if (!rawStock.some(isLegacyStockStatusParam)) return null;

  const canonical = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "stock" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      canonical.append(key, item);
    }
  }
  for (const status of parseStockStatusParams(searchParams.stock)) {
    canonical.append("stock", status);
  }

  return canonical.toString();
}

export function parseCatalogSort(searchParams: CatalogSearchParams): CatalogSort {
  const sort = firstValue(searchParams.sort);
  return isCatalogSort(sort) ? sort : "relevance";
}

export function getEmptyCatalogFilters(): CatalogFilters {
  return {
    query: "",
    categories: [],
    brands: [],
    stockStatuses: [],
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
  };
}

export function filterCatalogProducts(products: CatalogProduct[], filters: CatalogFilters) {
  const query = normalize(filters.query);
  const categories = normalizedSet(filters.categories);
  const brands = normalizedSet(filters.brands);
  const selectedStatuses = new Set<StockStatus>(filters.stockStatuses);

  return products.filter((product) => {
    if (query && !productMatchesQuery(product, query)) return false;
    if (categories.size > 0 && !categories.has(normalize(product.category))) return false;
    if (brands.size > 0 && !brands.has(normalize(product.brand))) return false;
    if (selectedStatuses.size > 0 && !selectedStatuses.has(product.stockStatus)) return false;
    if (!productMatchesVehicle(product, filters)) return false;

    return true;
  });
}

export function getCatalogFilterOptions(products: CatalogProduct[]): CatalogFilterOptions {
  const vehicles = products.flatMap((product) => product.vehicleCompatibilities);

  return {
    categories: uniqueSorted(products.map((product) => product.category)),
    brands: uniqueSorted(products.map((product) => product.brand)),
    categoryCounts: countBy(products, (product) => product.category),
    brandCounts: countBy(products, (product) => product.brand),
    stockStatuses: stockStatusOrder.filter((status) =>
      products.some((product) => product.stockStatus === status),
    ),
    ...buildVehicleFilterOptions(vehicles),
  };
}

export type VehicleFacet = Pick<VehicleCompatibility, "make" | "model" | "yearFrom" | "yearTo">;

/**
 * Convierte una lista plana de compatibilidades vehiculares (venga del mock o
 * de una query agregada a DB) en las opciones de filtro de vehículo.
 */
export function buildVehicleFilterOptions(
  vehicles: VehicleFacet[],
): Pick<
  CatalogFilterOptions,
  | "vehicleMakes"
  | "vehicleModels"
  | "vehicleModelsByMake"
  | "vehicleYears"
  | "vehicleYearsByMake"
  | "vehicleYearsByMakeModel"
> {
  const vehicleModelsByMake: Record<string, Set<string>> = {};
  const vehicleYearsByMake: Record<string, Set<string>> = {};
  const vehicleYearsByMakeModel: Record<string, Set<string>> = {};

  for (const vehicle of vehicles) {
    const years = range(vehicle.yearFrom, vehicle.yearTo).map(String);
    const makeModelKey = vehicleMakeModelKey(vehicle.make, vehicle.model);

    (vehicleModelsByMake[vehicle.make] ??= new Set<string>()).add(vehicle.model);

    const makeYears = (vehicleYearsByMake[vehicle.make] ??= new Set<string>());
    const makeModelYears = (vehicleYearsByMakeModel[makeModelKey] ??= new Set<string>());
    for (const year of years) {
      makeYears.add(year);
      makeModelYears.add(year);
    }
  }

  return {
    vehicleMakes: uniqueSorted(vehicles.map((vehicle) => vehicle.make)),
    vehicleModels: uniqueSorted(vehicles.map((vehicle) => vehicle.model)),
    vehicleModelsByMake: Object.fromEntries(
      Object.entries(vehicleModelsByMake).map(([make, models]) => [make, [...models].sort()]),
    ),
    vehicleYears: uniqueSorted(
      vehicles.flatMap((vehicle) => range(vehicle.yearFrom, vehicle.yearTo).map(String)),
    ).sort((a, b) => Number(b) - Number(a)),
    vehicleYearsByMake: sortYearSets(vehicleYearsByMake),
    vehicleYearsByMakeModel: sortYearSets(vehicleYearsByMakeModel),
  };
}

function sortYearSets(record: Record<string, Set<string>>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(record).map(([key, years]) => [
      key,
      [...years].sort((a, b) => Number(b) - Number(a)),
    ]),
  );
}

// ---------------------------------------------------------------------------
// Prisma where clause builder
// ---------------------------------------------------------------------------

/**
 * Convierte CatalogFilters en un objeto `where` de Prisma para filtrar
 * directamente en la base de datos.
 *
 * Cobertura:
 * - query: busca por name, sku, partNumber y brand con modo insensible a case.
 *   La búsqueda full-text (descripción, compatibilidad) sigue haciéndose en
 *   memoria vía filterCatalogProducts cuando se necesita (mock/autocomplete).
 * - categories: filtra por nombre de categoría (OR entre múltiples).
 * - brands: filtra por marca (OR entre múltiples).
 * - stockStatuses: traduce el estado de la app a InventoryStatus de Prisma.
 * - vehicle: filtra por VehicleCompatibility con make, model y año.
 *
 * Nota: los filtros de stockStatus requieren JOIN con inventoryStocks.
 * Prisma genera la subquery automáticamente mediante `inventoryStocks: { some: ... }`.
 */
export function buildPrismaWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const conditions: Prisma.ProductWhereInput[] = [];

  // Búsqueda por texto: nombre, SKU, número de parte y marca
  if (filters.query.trim()) {
    const q = filters.query.trim();
    conditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { partNumber: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  // Categorías (OR entre seleccionadas)
  if (filters.categories.length > 0) {
    conditions.push({
      category: { name: { in: filters.categories } },
    });
  }

  // Marcas (OR entre seleccionadas)
  if (filters.brands.length > 0) {
    conditions.push({
      brand: { in: filters.brands },
    });
  }

  // Estado de stock: traduce el estado de la app a InventoryStatus de Prisma
  if (filters.stockStatuses.length > 0) {
    const prismaStatuses: InventoryStatus[] = filters.stockStatuses.flatMap(stockStatusToPrismaStatuses);
    if (prismaStatuses.length > 0) {
      conditions.push({
        inventoryStocks: { some: { status: { in: prismaStatuses } } },
      });
    }
  }

  // Compatibilidad vehicular
  const vehicleConditions: Prisma.VehicleCompatibilityWhereInput = {};
  if (filters.vehicleMake) vehicleConditions.make = { equals: filters.vehicleMake, mode: "insensitive" };
  if (filters.vehicleModel) vehicleConditions.model = { equals: filters.vehicleModel, mode: "insensitive" };
  if (filters.vehicleYear) {
    const year = Number(filters.vehicleYear);
    if (Number.isInteger(year) && year > 0) {
      vehicleConditions.yearFrom = { lte: year };
      vehicleConditions.yearTo = { gte: year };
    }
  }
  if (Object.keys(vehicleConditions).length > 0) {
    conditions.push({ compatibilities: { some: vehicleConditions } });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  return where;
}

/**
 * Traduce un stockStatus de UI a los InventoryStatus equivalentes de Prisma.
 *
 * El estado de la app tiene tres valores; el enum de Prisma tiene cuatro:
 * PREORDER se presenta al cliente como "sin stock".
 */
export function stockStatusToPrismaStatuses(status: StockStatus): InventoryStatus[] {
  if (status === "IN_STOCK") return ["IN_STOCK"];
  if (status === "LOW_STOCK") return ["LOW_STOCK"];
  if (status === "OUT_OF_STOCK") return ["OUT_OF_STOCK", "PREORDER"];
  return [];
}

export function countActiveCatalogFilters(filters: CatalogFilters) {
  return [
    filters.query,
    filters.vehicleMake,
    filters.vehicleModel,
    filters.vehicleYear,
    ...filters.categories,
    ...filters.brands,
    ...filters.stockStatuses,
  ].filter(Boolean).length;
}

function productMatchesQuery(product: CatalogProduct, normalizedQuery: string) {
  const haystack = [
    product.name,
    product.category,
    product.brand,
    product.sku,
    product.partNumber,
    product.compatibility,
    product.description,
    ...product.compatibleVehicles,
    ...product.technicalDetails,
  ]
    .map(normalize)
    .join(" ");

  return haystack.includes(normalizedQuery);
}

function productMatchesVehicle(product: CatalogProduct, filters: CatalogFilters) {
  if (!filters.vehicleMake && !filters.vehicleModel && !filters.vehicleYear) {
    return true;
  }

  return product.vehicleCompatibilities.some((vehicle) => {
    if (filters.vehicleMake && normalize(vehicle.make) !== normalize(filters.vehicleMake)) return false;
    if (filters.vehicleModel && normalize(vehicle.model) !== normalize(filters.vehicleModel)) return false;
    if (filters.vehicleYear && !vehicleSupportsYear(vehicle, filters.vehicleYear)) return false;

    return true;
  });
}

function vehicleSupportsYear(vehicle: VehicleCompatibility, yearValue: string) {
  const year = Number(yearValue);
  if (!Number.isInteger(year)) return false;

  return year >= vehicle.yearFrom && year <= vehicle.yearTo;
}

type VehicleCompatibility = CatalogProduct["vehicleCompatibilities"][number];

function firstValue(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() ?? "";
}

function valuesFor(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : [value];
  return uniqueSorted(values.filter((item): item is string => Boolean(item)).map((item) => item.trim()))
    .filter(Boolean);
}

function normalizedSet(values: string[]) {
  return new Set(values.map(normalize));
}

/**
 * Lee el query param `stock`, aceptando tanto los identificadores canónicos
 * como los valores en español que la app publicó antes del refactor.
 */
function parseStockStatusParams(value: string | string[] | undefined): StockStatus[] {
  const parsed = valuesFor(value)
    .map(parseStockStatusParam)
    .filter((status): status is StockStatus => status !== null);

  return [...new Set(parsed)];
}

function isCatalogSort(value: string): value is CatalogSort {
  return catalogSortOptions.some((option) => option.value === value);
}

function countBy<T>(items: T[], keyOf: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyOf(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));
}

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
