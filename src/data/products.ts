import { db } from "@/lib/db";
import {
  getProductBySlug,
  getRelatedProducts,
  mockProducts,
  type MockProduct,
} from "./mock-products";

export type CatalogProduct = MockProduct;

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
  try {
    const products = await findDbProducts();
    return products.length > 0 ? products.map(mapDbProduct) : mockProducts;
  } catch {
    return mockProducts;
  }
}

export async function getFeaturedCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const products = await db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      orderBy: { name: "asc" },
      take: 6,
    });

    return products.length > 0 ? products.map(mapDbProduct) : mockProducts.slice(0, 6);
  } catch {
    return mockProducts.slice(0, 6);
  }
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  try {
    const product = await db.product.findUnique({
      where: { slug },
      include: productInclude,
    });

    return product ? mapDbProduct(product) : getProductBySlug(slug);
  } catch {
    return getProductBySlug(slug);
  }
}

export async function getCatalogProductSlugs() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true },
      orderBy: { name: "asc" },
    });

    return products.length > 0
      ? products.map((product) => ({ slug: product.slug }))
      : mockProducts.map((product) => ({ slug: product.slug }));
  } catch {
    return mockProducts.map((product) => ({ slug: product.slug }));
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

    return products.length > 0 ? products.map(mapDbProduct) : getRelatedProducts(product);
  } catch {
    return getRelatedProducts(product);
  }
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
    partNumber: product.partNumber ?? "Sin numero de parte",
    compatibility: formatCompatibilitySummary(product),
    compatibleVehicles: formatCompatibleVehicles(product),
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
  if (status === "PREORDER") return "Preorder";
  if (status === "LOW_STOCK") return "Bajo stock";
  if (quantity > 0) return "En stock";
  return "Preorder";
}
