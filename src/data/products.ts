import { db } from "@/lib/db";
import {
  getProductBySlug,
  getRelatedProducts,
  mockProducts,
  type MockProduct,
} from "./mock-products";
import { shouldUseMockCatalogFallback } from "./catalog-source";

export { shouldUseMockCatalogFallback } from "./catalog-source";

export type CatalogProduct = MockProduct;
export type CatalogProductSource = "database" | "mock";
export type CatalogProductStatus = "empty" | "ready" | "unavailable";

export type CatalogProductsResult = {
  products: CatalogProduct[];
  source: CatalogProductSource | null;
  status: CatalogProductStatus;
};

type DbProduct = Awaited<ReturnType<typeof findDbProducts>>[number];

const productInclude = {
  category: true,
  compatibilities: true,
  inventoryStocks: true,
} as const;

async function findDbProducts() {
  return db.product.findMany({
    where: { isActive: true },
    include: productInclude,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
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
  console.error("Catalog data source unavailable.", error);
}
