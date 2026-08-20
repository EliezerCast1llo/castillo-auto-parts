import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import {
  getProductBySlug,
  getRelatedProducts,
  mockProducts,
  type MockProduct,
} from "./mock-products";
import { shouldUseMockCatalogFallback } from "./catalog-source";
import { defaultLocale, type Locale } from "@/lib/i18n/config";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import {
  buildPrismaWhere,
  buildVehicleFilterOptions,
  filterCatalogProducts,
  getCatalogFilterOptions,
  stockStatusOrder,
  uniqueSorted,
  type CatalogFilterOptions,
  type CatalogFilters,
  type CatalogSort,
} from "./catalog-filters";

export { shouldUseMockCatalogFallback } from "./catalog-source";

/**
 * Número de productos por página en el catálogo paginado.
 * Se puede ajustar sin cambiar la lógica de paginación.
 */
export const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// Data cache (unstable_cache) con tags
//
// - Tag "catalog": todas las listas/facetas del catálogo. Las server actions
//   de admin lo invalidan con revalidateTag(CATALOG_CACHE_TAG) al mutar
//   productos.
// - Tag `product:{slug}` (productCacheTag): detalle individual.
// - `revalidate` actúa como red de seguridad si una mutación olvida invalidar.
//
// Solo se cachea la query cruda a DB: los errores propagan (y por tanto no se
// cachean) y la decisión de mock-fallback ocurre fuera del cache, para no
// congelar datos simulados ni estados de error.
// ---------------------------------------------------------------------------

export const CATALOG_CACHE_TAG = "catalog";
const CATALOG_REVALIDATE_SECONDS = 300;

export function productCacheTag(slug: string) {
  return `product:${slug}`;
}

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
/**
 * Include del catálogo, con las traducciones del idioma pedido.
 *
 * El filtro por idioma va en el `where` de la relación y no se omite para el
 * idioma principal: la forma del resultado queda igual para todos, así hay un
 * solo tipo y un solo camino de mapeo. Para el español la relación viene vacía
 * —no existen filas— y el costo es una búsqueda por índice.
 */
function productIncludeFor(locale: Locale) {
  return {
    category: { include: { translations: { where: { locale } } } },
    compatibilities: true,
    inventoryStocks: true,
    images: {
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    },
    translations: { where: { locale } },
  } satisfies Prisma.ProductInclude;
}

/** Query cruda del catálogo activo, sin cache. */
function queryAllActiveProducts(locale: Locale) {
  return db.product.findMany({
    where: { isActive: true },
    include: productIncludeFor(locale),
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
}

/**
 * Doble capa de cache:
 * - unstable_cache: data cache entre requests, invalidado por tag "catalog".
 * - React.cache(): dedupe dentro del mismo render tree — si múltiples Server
 *   Components en la misma request llaman getCatalogProducts(), una sola lectura.
 * Documentación: https://react.dev/reference/react/cache
 */
const findDbProducts = cache(
  unstable_cache(queryAllActiveProducts, ["catalog-products"], {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CACHE_TAG],
  }),
);

/**
 * Variante sin data cache, deduplicada solo dentro de la request.
 * Úsala donde el stock debe ser exacto (carrito, checkout): servir stock
 * cacheado ahí permitiría comprar un producto ya agotado.
 */
const findLiveDbProducts = cache(queryAllActiveProducts);

const findDbFeaturedProducts = unstable_cache(
  async (locale: Locale) =>
    db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productIncludeFor(locale),
      orderBy: { name: "asc" },
      take: 6,
    }),
  ["catalog-featured-products"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
);

/**
 * Detalle por slug: cache por-slug con tag propio para invalidación quirúrgica
 * desde admin, más react.cache para dedupe generateMetadata + page en la misma
 * request (antes eran dos queries).
 */
const findDbProductBySlug = cache(async (slug: string, locale: Locale) =>
  unstable_cache(
    () =>
      db.product.findUnique({
        where: { slug },
        include: productIncludeFor(locale),
      }),
    ["catalog-product-by-slug", slug, locale],
    {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [CATALOG_CACHE_TAG, productCacheTag(slug)],
    },
  )(),
);

const findDbProductSlugs = unstable_cache(
  () =>
    db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { name: "asc" },
    }),
  ["catalog-product-slugs"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
);

const findDbFilteredProducts = unstable_cache(
  async (filters: CatalogFilters, page: number, sort: CatalogSort, locale: Locale) => {
    const where = buildPrismaWhere(filters);
    const [totalCount, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: productIncludeFor(locale),
        orderBy: getCatalogOrderBy(sort),
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);
    return { totalCount, products };
  },
  ["catalog-filtered-products"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
);

const findDbRelatedProducts = unstable_cache(
  (categoryName: string, excludeSlug: string, locale: Locale) =>
    db.product.findMany({
      where: {
        isActive: true,
        slug: { not: excludeSlug },
        category: { name: categoryName },
      },
      include: productIncludeFor(locale),
      orderBy: { name: "asc" },
      take: 3,
    }),
  ["catalog-related-products"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
);

function findDbSearchProducts(query: string, limit: number, locale: Locale) {
  return db.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        // Sin esto, quien busca en inglés no encuentra nada: el nombre
        // traducido vive en otra tabla.
        {
          translations: {
            some: { locale, name: { contains: query, mode: "insensitive" } },
          },
        },
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
      category: {
        select: { name: true, translations: { where: { locale }, select: { name: true } } },
      },
      translations: { where: { locale }, select: { name: true } },
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

/**
 * Catálogo con stock en vivo (sin data cache). Para carrito y checkout, donde
 * un stock desactualizado permitiría comprar producto agotado.
 */
export async function getLiveCatalogProducts(): Promise<CatalogProduct[]> {
  const result = await getCatalogProductsResult({ live: true });
  return result.products;
}

/**
 * El idioma se recibe como parámetro y **no** se lee del contexto del request.
 *
 * No es estilo: `unstable_cache` deriva su clave de los argumentos de la
 * función. Si el idioma se leyera adentro, español e inglés compartirían las
 * mismas filas cacheadas y cada visitante vería el idioma que otro calentó
 * primero. Pasarlo como argumento hace que la clave los separe sola.
 *
 * El valor por defecto deja compilando a los llamadores que no traducen —
 * sitemap, admin— sin obligarlos a decidir.
 */
export async function getCatalogProductsResult({
  live = false,
  locale = defaultLocale,
}: { live?: boolean; locale?: Locale } = {}): Promise<CatalogProductsResult> {
  try {
    const products = live ? await findLiveDbProducts(locale) : await findDbProducts(locale);
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

export async function getFeaturedCatalogProductsResult(
  locale: Locale = defaultLocale,
): Promise<CatalogProductsResult> {
  try {
    const products = await findDbFeaturedProducts(locale);

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

export async function getCatalogProductBySlug(
  slug: string,
  locale: Locale = defaultLocale,
): Promise<CatalogProduct | undefined> {
  try {
    const product = await findDbProductBySlug(slug, locale);

    return product ? mapDbProduct(product) : getFallbackProductBySlug(slug);
  } catch (error) {
    logCatalogDataError(error);
    return getFallbackProductBySlug(slug);
  }
}

export type CatalogSitemapEntry = {
  slug: string;
  lastModified: Date | string;
};

/**
 * Slugs con fecha real de última modificación, para el sitemap.
 * En mock fallback no hay updatedAt: se usa la fecha actual (solo dev).
 */
export async function getCatalogSitemapEntries(): Promise<CatalogSitemapEntry[]> {
  try {
    const products = await findDbProductSlugs();

    if (products.length > 0) {
      return products.map((product) => ({
        slug: product.slug,
        lastModified: product.updatedAt,
      }));
    }

    return buildMockSitemapEntries();
  } catch (error) {
    logCatalogDataError(error);
    return buildMockSitemapEntries();
  }
}

function buildMockSitemapEntries(): CatalogSitemapEntry[] {
  return shouldUseMockCatalogFallback()
    ? mockProducts.map((product) => ({ slug: product.slug, lastModified: new Date() }))
    : [];
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
  locale: Locale = defaultLocale,
): Promise<CatalogSearchProductsResult> {
  try {
    const products = await findDbSearchProducts(query, limit, locale);

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
  sort: CatalogSort = "relevance",
  locale: Locale = defaultLocale,
): Promise<PaginatedCatalogResult> {
  const safePage = Math.max(1, Math.floor(page));

  try {
    const { totalCount, products } = await findDbFilteredProducts(filters, safePage, sort, locale);

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
    return buildMockPaginatedResult(filters, safePage, sort);
  } catch (error) {
    logCatalogDataError(error);

    if (shouldUseMockCatalogFallback()) {
      return buildMockPaginatedResult(filters, safePage, sort);
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
function buildMockPaginatedResult(
  filters: CatalogFilters,
  page: number,
  sort: CatalogSort = "relevance",
): PaginatedCatalogResult {
  const filtered = sortCatalogProducts(filterCatalogProducts(mockProducts, filters), sort);
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

function getCatalogOrderBy(sort: CatalogSort): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price-asc") {
    return [{ priceCents: "asc" }, { name: "asc" }];
  }

  if (sort === "price-desc") {
    return [{ priceCents: "desc" }, { name: "asc" }];
  }

  if (sort === "newest") {
    return [{ createdAt: "desc" }, { name: "asc" }];
  }

  return [{ isFeatured: "desc" }, { name: "asc" }];
}

function sortCatalogProducts(products: CatalogProduct[], sort: CatalogSort) {
  const sorted = [...products];

  if (sort === "price-asc") {
    return sorted.sort((left, right) => left.priceCents - right.priceCents || compareByName(left, right));
  }

  if (sort === "price-desc") {
    return sorted.sort((left, right) => right.priceCents - left.priceCents || compareByName(left, right));
  }

  if (sort === "newest") {
    return sorted.reverse();
  }

  return sorted;
}

function compareByName(left: CatalogProduct, right: CatalogProduct) {
  return left.name.localeCompare(right.name, "es");
}

// ---------------------------------------------------------------------------
// Facetas del catálogo (opciones de filtros)
// ---------------------------------------------------------------------------

/**
 * Facetas con queries agregadas — evita cargar la tabla completa de productos
 * (con todas sus relaciones) solo para derivar las opciones de filtro.
 */
/**
 * El idioma va como argumento y no leído del contexto: `unstable_cache` deriva
 * la clave de los argumentos, así que sin esto las facetas en inglés y en
 * español compartirían fila de caché y la UI mostraría la que se haya calentado
 * primero.
 */
const findDbCatalogFacets = unstable_cache(
  async (locale: Locale) => {
    const [brandGroups, categories, stockGroups, vehicles] = await Promise.all([
      db.product.groupBy({ by: ["brand"], where: { isActive: true }, _count: { _all: true } }),
      db.productCategory.findMany({
        where: { isActive: true, products: { some: { isActive: true } } },
        select: {
          name: true,
          slug: true,
          translations: { where: { locale }, select: { name: true } },
          _count: { select: { products: { where: { isActive: true } } } },
        },
      }),
      db.inventoryStock.groupBy({
        by: ["status"],
        where: { product: { isActive: true } },
      }),
      db.vehicleCompatibility.findMany({
        where: { product: { isActive: true } },
        select: { make: true, model: true, yearFrom: true, yearTo: true },
        distinct: ["make", "model", "yearFrom", "yearTo"],
      }),
    ]);

    return {
      brands: brandGroups.map((group) => group.brand),
      brandCounts: Object.fromEntries(
        brandGroups.map((group) => [group.brand, group._count._all]),
      ),
      categories: categories.map((category) => ({
        slug: category.slug,
        label: translated(category.translations[0]?.name, category.name),
        count: category._count.products,
      })),
      stockStatuses: stockGroups.map((group) => group.status),
      vehicles,
    };
  },
  ["catalog-facets"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
);

/**
 * Opciones de filtro del catálogo. Con DB disponible usa agregaciones; en
 * fallback deriva las opciones del mock con getCatalogFilterOptions.
 */
export async function getCatalogFacets(
  locale: Locale = defaultLocale,
): Promise<CatalogFilterOptions> {
  try {
    const facets = await findDbCatalogFacets(locale);
    const hasData = facets.brands.length > 0 || facets.categories.length > 0;

    if (hasData || !shouldUseMockCatalogFallback()) {
      // quantity=1: a nivel de faceta solo interesa el mapeo del enum de
      // Prisma al estado de la app, no la cantidad real por producto.
      const stockStatusSet = new Set(
        facets.stockStatuses.map((status) => toStockStatus(status, 1)),
      );

      // Las categorías se ordenan por la etiqueta que se ve, no por el slug:
      // en inglés "Brakes" y "Belts" no salen en el mismo orden que "Frenos" y
      // "Correas", y el orden alfabético es del texto que el usuario lee.
      const sortedCategories = [...facets.categories].sort((a, b) =>
        a.label.localeCompare(b.label, toIntlLocale(locale)),
      );

      return {
        brands: uniqueSorted(facets.brands),
        brandCounts: facets.brandCounts,
        categories: sortedCategories.map((category) => category.slug),
        categoryLabels: Object.fromEntries(
          sortedCategories.map((category) => [category.slug, category.label]),
        ),
        categoryCounts: Object.fromEntries(
          sortedCategories.map((category) => [category.slug, category.count]),
        ),
        stockStatuses: stockStatusOrder.filter((status) => stockStatusSet.has(status)),
        ...buildVehicleFilterOptions(facets.vehicles),
      };
    }

    return getCatalogFilterOptions(mockProducts);
  } catch (error) {
    logCatalogDataError(error);

    if (shouldUseMockCatalogFallback()) {
      return getCatalogFilterOptions(mockProducts);
    }

    return getCatalogFilterOptions([]);
  }
}

export async function getRelatedCatalogProducts(
  product: CatalogProduct,
  locale: Locale = defaultLocale,
) {
  try {
    const products = await findDbRelatedProducts(product.category, product.slug, locale);

    return products.length > 0
      ? products.map(mapDbProduct)
      : getFallbackRelatedProducts(product);
  } catch (error) {
    logCatalogDataError(error);
    return getFallbackRelatedProducts(product);
  }
}

export function isPurchasableStockStatus(status: CatalogProduct["stockStatus"]) {
  return status !== "OUT_OF_STOCK";
}

/**
 * Primer valor no vacío. El fallback de traducciones es **por campo**: un
 * producto con nombre en inglés pero sin descripción muestra el nombre
 * traducido y la descripción en español, en vez de caer entero a un idioma.
 */
function translated(...values: (string | null | undefined)[]): string {
  return values.find((value) => value != null && value.trim() !== "") ?? "";
}

function mapDbProduct(product: DbProduct): CatalogProduct {
  const translation = product.translations[0];
  const categoryTranslation = product.category.translations[0];

  // La descripción corta no se muestra en un campo propio: es el respaldo de
  // "compatibilidad" cuando el producto no tiene vehículos cargados. Si no se
  // traduce acá, el admin puede cargar la versión en inglés, guardarla, y no
  // verla nunca en ningún lado.
  const shortDescription = translated(translation?.shortDescription, product.shortDescription);

  const stock = product.inventoryStocks[0];
  const stockQuantity = stock ? Math.max(stock.quantityOnHand - stock.quantityReserved, 0) : 0;

  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0] ?? null;

  return {
    slug: product.slug,
    name: translated(translation?.name, product.name),
    category: translated(categoryTranslation?.name, product.category.name),
    categorySlug: product.category.slug,
    brand: product.brand,
    sku: product.sku,
    partNumber: product.partNumber ?? "Sin número de parte",
    compatibility: formatCompatibilitySummary(product, shortDescription),
    compatibleVehicles: formatCompatibleVehicles(product, shortDescription),
    vehicleCompatibilities: product.compatibilities.map((compatibility) => ({
      make: compatibility.make,
      model: compatibility.model,
      yearFrom: compatibility.yearFrom,
      yearTo: compatibility.yearTo,
    })),
    description: translated(translation?.description, product.description),
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
    category: translated(product.category.translations[0]?.name, product.category.name),
    name: translated(product.translations[0]?.name, product.name),
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

function formatCompatibilitySummary(product: DbProduct, shortDescription: string) {
  const vehicles = formatCompatibleVehicles(product, shortDescription);
  return vehicles.length > 0 ? vehicles.join(" · ") : shortDescription || "Validar compatibilidad";
}

function formatCompatibleVehicles(product: DbProduct, shortDescription: string) {
  const compatibilities = product.compatibilities.map(
    (compatibility) =>
      `${compatibility.make} ${compatibility.model} ${compatibility.yearFrom}-${compatibility.yearTo}`,
  );

  if (compatibilities.length > 0) return compatibilities;
  return shortDescription ? [shortDescription] : [];
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

/** PREORDER se presenta al cliente igual que OUT_OF_STOCK. */
function toStockStatus(status: string | undefined, quantity: number): CatalogProduct["stockStatus"] {
  if (status === "PREORDER" || status === "OUT_OF_STOCK") return "OUT_OF_STOCK";
  if (status === "LOW_STOCK") return "LOW_STOCK";
  if (quantity > 0) return "IN_STOCK";
  return "OUT_OF_STOCK";
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
