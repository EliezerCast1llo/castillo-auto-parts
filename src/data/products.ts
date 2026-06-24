import { cache } from "react";
import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import {
  getProductBySlug,
  getRelatedProducts,
  mockProducts,
  type MockProduct,
} from "./mock-products";
import { shouldUseMockCatalogFallback } from "./catalog-source";
import { buildPrismaWhere, filterCatalogProducts, type CatalogFilters } from "./catalog-filters";

export { shouldUseMockCatalogFallback } from "./catalog-source";

/**
 * Número de productos por página en el catálogo paginado.
 * Se puede ajustar sin cambiar la lógica de paginación.
 */
export const PAGE_SIZE = 12;

export type CatalogProduct = MockProduct;
export type CatalogProductSource = "database" | "mock";
export type CatalogProductStatus = "empty" | "ready" | "unavailable";

export type CatalogProductsResult = {
  products: CatalogProduct[];
  source: CatalogProductSource | null;
  status: CatalogProductStatus;
};

type DbProduct = Awaited<ReturnType<typeof findDbProducts>>[number];
type DbSearchProduct = Awaited<ReturnType<typeof findDbSearchProducts>>[number];

// Sin `as const` en el objeto completo: Prisma necesita arrays mutables para orderBy.
// Los literales "desc"/"asc" se preservan con las aserciones inline.
const productInclude = {
  category: true,
  compatibilities: true,
  inventoryStocks: true,
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
  },
};

/**
 * React.cache() deduplicates esta query dentro del mismo render tree.
 * Si múltiples Server Components en la misma request llaman getCatalogProducts(),
 * solo se ejecuta una query a DB. Cada nueva request/render obtiene datos frescos.
 * Documentación: https://react.dev/reference/react/cache
 */
const findDbProducts = cache(async () => {
  return db.product.findMany({
    where: { isActive: true },
    include: productInclude,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
});

function findDbSearchProducts(query: string, limit: number) {
  return db.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { partNumber: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { category: { name: { contains: query, mode: "insensitive" } } },
        {
          compatibilities: {
            some: {
              OR: [
                { make: { contains: query, mode: "insensitive" } },
                { model: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    select: {
      category: { select: { name: true } },
      inventoryStocks: {
        select: {
          quantityOnHand: true,
          quantityReserved: true,
          status: true,
        },
        take: 1,
      },
      name: true,
      priceCents: true,
      sku: true,
      slug: true,
    },
    take: limit,
  });
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const result = await getCatalogProductsResult();
  return result.products;
}

export async function getCatalogProductsResult(): Promise<CatalogProductsResult> {
  try {
    const products = await findDbProducts();
    if (products.length > 0) {
      return {
        products: products.map(mapDbProduct),
        source: "database",
        status: "ready",
      };
    }

    if (shouldUseMockCatalogFallback()) {
      return {
        products: mockProducts,
        source: "mock",
        status: "ready",
      };
    }

    return {
      products: [],
      source: "database",
      status: "empty",
    };
  } catch (error) {
    logCatalogDataError(error);

    if (shouldUseMockCatalogFallback()) {
      return {
        products: mockProducts,
        source: "mock",
        status: "ready",
      };
    }

    return {
      products: [],
      source: null,
      status: "unavailable",
    };
  }
}

export async function getFeaturedCatalogProducts(): Promise<CatalogProduct[]> {
  const result = await getFeaturedCatalogProductsResult();
  return result.products;
}

export async function getFeaturedCatalogProductsResult(): Promise<CatalogProductsResult> {
  try {
    const products = await db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      orderBy: { name: "asc" },
      take: 6,
    });

    if (products.length > 0) {
      return {
        products: products.map(mapDbProduct),
        source: "database",
        status: "ready",
      };
    }

    if (shouldUseMockCatalogFallback()) {
      return {
        products: mockProducts.slice(0, 6),
        source: "mock",
        status: "ready",
      };
    }

    return {
      products: [],
      source: "database",
      status: "empty",
    };
  } catch (error) {
    logCatalogDataError(error);

    if (shouldUseMockCatalogFallback()) {
      return {
        products: mockProducts.slice(0, 6),
        source: "mock",
        status: "ready",
      };
    }

    return {
      products: [],
      source: null,
      status: "unavailable",
    };
  }
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  try {
    const product = await db.product.findUnique({
      where: { slug },
      include: productInclude,
    });

    return product ? mapDbProduct(product) : getFallbackProductBySlug(slug);
  } catch (error) {
    logCatalogDataError(error);
    return getFallbackProductBySlug(slug);
  }
}

export async function getCatalogProductSlugs() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true },
      orderBy: { name: "asc" },
    });

    if (products.length > 0) {
      return products.map((product) => ({ slug: product.slug }));
    }

    return shouldUseMockCatalogFallback()
      ? mockProducts.map((product) => ({ slug: product.slug }))
      : [];
  } catch (error) {
    logCatalogDataError(error);
    return shouldUseMockCatalogFallback()
      ? mockProducts.map((product) => ({ slug: product.slug }))
      : [];
  }
}

export type CatalogSearchProduct = {
  category: string;
  name: string;
  priceCents: number;
  sku: string;
  slug: string;
  stockStatus: CatalogProduct["stockStatus"];
};

export type CatalogSearchProductsResult = {
  products: CatalogSearchProduct[];
  source: CatalogProductSource | null;
  status: CatalogProductStatus;
};

export async function searchCatalogProducts(
  query: string,
  limit: number,
): Promise<CatalogSearchProductsResult> {
  try {
    const products = await findDbSearchProducts(query, limit);

    if (products.length > 0 || !shouldUseMockCatalogFallback()) {
      return {
        products: products.map(mapDbSearchProduct),
        source: "database",
        status: products.length === 0 ? "empty" : "ready",
      };
    }

    return buildMockSearchResult(query, limit);
  } catch (error) {
    logCatalogDataError(error);

    if (shouldUseMockCatalogFallback()) {
      return buildMockSearchResult(query, limit);
    }

    return {
      products: [],
      source: null,
      status: "unavailable",
    };
  }
}

// ---------------------------------------------------------------------------
// Catálogo paginado con filtros en base de datos
// ---------------------------------------------------------------------------

export type PaginatedCatalogResult = {
  products: CatalogProduct[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  source: CatalogProductSource | null;
  status: CatalogProductStatus;
};

/**
 * Obtiene productos del catálogo aplicando filtros directamente en DB y
 * paginando con offset.
 *
 * Estrategia:
 * - Si hay DB disponible: aplica `buildPrismaWhere` para filtrar en Prisma y
 *   usa skip/take para la paginación. El count total usa la misma cláusula where.
 * - Si no hay DB (mock fallback): filtra en memoria con `filterCatalogProducts`
 *   y pagina en JS. La paginación del mock es solo para desarrollo local.
 *
 * La función `getCatalogProducts()` original se mantiene sin cambios para
 * retrocompatibilidad con el autocomplete (/api/search) y páginas de detalle.
 */
export async function getFilteredCatalogProducts(
  filters: CatalogFilters,
  page: number,
): Promise<PaginatedCatalogResult> {
  const safePage = Math.max(1, Math.floor(page));

  try {
    const where = buildPrismaWhere(filters);
    const [totalCount, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: productInclude,
        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        skip: (safePage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    if (totalCount > 0 || !shouldUseMockCatalogFallback()) {
      return {
        products: products.map(mapDbProduct),
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
        currentPage: safePage,
        source: "database",
        status: totalCount === 0 ? "empty" : "ready",
      };
    }

    // DB respondió vacía y estamos en modo fallback → usar mock
    return buildMockPaginatedResult(filters, safePage);
  } catch (error) {
    logCatalogDataError(error);

    if (shouldUseMockCatalogFallback()) {
      return buildMockPaginatedResult(filters, safePage);
    }

    return {
      products: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: safePage,
      source: null,
      status: "unavailable",
    };
  }
}

/**
 * Paginación en memoria sobre el mock, usada solo cuando la DB no responde
 * y el fallback está habilitado (siempre fuera de producción).
 */
function buildMockPaginatedResult(filters: CatalogFilters, page: number): PaginatedCatalogResult {
  const filtered = filterCatalogProducts(mockProducts, filters);
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return {
    products: filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    totalCount,
    totalPages,
    currentPage: safePage,
    source: "mock",
    status: "ready",
  };
}

export async function getRelatedCatalogProducts(product: CatalogProduct) {
  try {
    const products = await db.product.findMany({
      where: {
        isActive: true,
        slug: { not: product.slug },
        category: { name: product.category },
      },
      include: productInclude,
      orderBy: { name: "asc" },
      take: 3,
    });

    return products.length > 0
      ? products.map(mapDbProduct)
      : getFallbackRelatedProducts(product);
  } catch (error) {
    logCatalogDataError(error);
    return getFallbackRelatedProducts(product);
  }
}

export function isPurchasableStockStatus(status: CatalogProduct["stockStatus"]) {
  return status !== "No disponible";
}

function mapDbProduct(product: DbProduct): CatalogProduct {
  const stock = product.inventoryStocks[0];
  const stockQuantity = stock ? Math.max(stock.quantityOnHand - stock.quantityReserved, 0) : 0;

  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0] ?? null;

  return {
    slug: product.slug,
    name: product.name,
    category: product.category.name,
    brand: product.brand,
    sku: product.sku,
    partNumber: product.partNumber ?? "Sin número de parte",
    compatibility: formatCompatibilitySummary(product),
    compatibleVehicles: formatCompatibleVehicles(product),
    vehicleCompatibilities: product.compatibilities.map((compatibility) => ({
      make: compatibility.make,
      model: compatibility.model,
      yearFrom: compatibility.yearFrom,
      yearTo: compatibility.yearTo,
    })),
    description: product.description ?? "",
    technicalDetails: toStringArray(product.technicalDetails),
    priceCents: product.priceCents,
    stockQuantity,
    stockStatus: toStockStatus(stock?.status, stockQuantity),
    primaryImageUrl: primaryImage?.url ?? null,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
    })),
  };
}

function mapDbSearchProduct(product: DbSearchProduct): CatalogSearchProduct {
  const stock = product.inventoryStocks[0];
  const stockQuantity = stock ? Math.max(stock.quantityOnHand - stock.quantityReserved, 0) : 0;

  return {
    category: product.category.name,
    name: product.name,
    priceCents: product.priceCents,
    sku: product.sku,
    slug: product.slug,
    stockStatus: toStockStatus(stock?.status, stockQuantity),
  };
}

function buildMockSearchResult(query: string, limit: number): CatalogSearchProductsResult {
  const products = filterCatalogProducts(mockProducts, {
    ...getEmptySearchFilters(),
    query,
  }).slice(0, limit);

  return {
    products: products.map((product) => ({
      category: product.category,
      name: product.name,
      priceCents: product.priceCents,
      sku: product.sku,
      slug: product.slug,
      stockStatus: product.stockStatus,
    })),
    source: "mock",
    status: "ready",
  };
}

function getEmptySearchFilters(): CatalogFilters {
  return {
    brands: [],
    categories: [],
    query: "",
    stockStatuses: [],
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
  };
}

function formatCompatibilitySummary(product: DbProduct) {
  const vehicles = formatCompatibleVehicles(product);
  return vehicles.length > 0 ? vehicles.join(" · ") : product.shortDescription ?? "Validar compatibilidad";
}

function formatCompatibleVehicles(product: DbProduct) {
  const compatibilities = product.compatibilities.map(
    (compatibility) =>
      `${compatibility.make} ${compatibility.model} ${compatibility.yearFrom}-${compatibility.yearTo}`,
  );

  return compatibilities.length > 0
    ? compatibilities
    : product.shortDescription
      ? [product.shortDescription]
      : [];
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toStockStatus(status: string | undefined, quantity: number): CatalogProduct["stockStatus"] {
  if (status === "PREORDER" || status === "OUT_OF_STOCK") return "No disponible";
  if (status === "LOW_STOCK") return "Últimas unidades";
  if (quantity > 0) return "Disponible";
  return "No disponible";
}

function getFallbackProductBySlug(slug: string) {
  return shouldUseMockCatalogFallback() ? getProductBySlug(slug) : undefined;
}

function getFallbackRelatedProducts(product: CatalogProduct) {
  return shouldUseMockCatalogFallback() ? getRelatedProducts(product) : [];
}

function logCatalogDataError(error: unknown) {
  logError({ context: "catalog-data-source" }, error);
}
