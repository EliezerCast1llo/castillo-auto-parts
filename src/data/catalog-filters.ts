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
  stockStatuses: CatalogProduct["stockStatus"][];
  vehicleMakes: string[];
  vehicleModels: string[];
  vehicleModelsByMake: Record<string, string[]>;
  vehicleYears: string[];
};

const stockStatusOrder: CatalogProduct["stockStatus"][] = [
  "Disponible",
  "Últimas unidades",
  "No disponible",
];

export function parseCatalogFilters(searchParams: CatalogSearchParams): CatalogFilters {
  return {
    query: firstValue(searchParams.q),
    categories: valuesFor(searchParams.category),
    brands: valuesFor(searchParams.brand),
    stockStatuses: valuesFor(searchParams.stock).filter(isCatalogStockStatus),
    vehicleMake: firstValue(searchParams.vehicleMake),
    vehicleModel: firstValue(searchParams.vehicleModel),
    vehicleYear: firstValue(searchParams.vehicleYear),
  };
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
  const stockStatuses = normalizedSet(filters.stockStatuses);

  return products.filter((product) => {
    if (query && !productMatchesQuery(product, query)) return false;
    if (categories.size > 0 && !categories.has(normalize(product.category))) return false;
    if (brands.size > 0 && !brands.has(normalize(product.brand))) return false;
    if (stockStatuses.size > 0 && !stockStatuses.has(normalize(product.stockStatus))) return false;
    if (!productMatchesVehicle(product, filters)) return false;

    return true;
  });
}

export function getCatalogFilterOptions(products: CatalogProduct[]): CatalogFilterOptions {
  const vehicles = products.flatMap((product) => product.vehicleCompatibilities);

  const vehicleModelsByMake = vehicles.reduce<Record<string, Set<string>>>((accumulator, vehicle) => {
    accumulator[vehicle.make] ??= new Set<string>();
    accumulator[vehicle.make].add(vehicle.model);
    return accumulator;
  }, {});

  return {
    categories: uniqueSorted(products.map((product) => product.category)),
    brands: uniqueSorted(products.map((product) => product.brand)),
    stockStatuses: stockStatusOrder.filter((status) =>
      products.some((product) => product.stockStatus === status),
    ),
    vehicleMakes: uniqueSorted(vehicles.map((vehicle) => vehicle.make)),
    vehicleModels: uniqueSorted(vehicles.map((vehicle) => vehicle.model)),
    vehicleModelsByMake: Object.fromEntries(
      Object.entries(vehicleModelsByMake).map(([make, models]) => [make, [...models].sort()]),
    ),
    vehicleYears: uniqueSorted(
      vehicles.flatMap((vehicle) => range(vehicle.yearFrom, vehicle.yearTo).map(String)),
    ).sort((a, b) => Number(b) - Number(a)),
  };
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

function isCatalogStockStatus(value: string): value is CatalogProduct["stockStatus"] {
  return stockStatusOrder.some((status) => status === value);
}

function uniqueSorted(values: string[]) {
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
