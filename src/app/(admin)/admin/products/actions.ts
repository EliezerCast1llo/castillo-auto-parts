"use server";

import { InventoryStatus, Prisma } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { revalidateStorefrontPath } from "@/lib/i18n/revalidate";
import { redirect } from "next/navigation";
import { CATALOG_CACHE_TAG, productCacheTag } from "@/data/products";
import {
  normalizeAdminInventoryStatus,
  parseAdminPriceCents,
  parseCompatibilityLines,
  parseTechnicalDetails,
  slugifyProductValue,
} from "@/lib/admin-products";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { requireAdminRole } from "@/lib/admin-auth";
import { formString, optionalFormStringOrNull } from "@/lib/form-utils";
import { db } from "@/lib/db";
import { parsePackageMeasurements } from "@/lib/package-measurements";
import { isValidCatalogSku, normalizeCatalogSku } from "@/lib/product-sku";
import { findCatalogSkuMatches } from "@/lib/catalog-sku";

const DEFAULT_LOCATION_CODE = "MAIN";

type AdminProductInput = {
  brand: string;
  categoryId: string;
  compatibilities: ReturnType<typeof parseCompatibilityLines>["items"];
  description: string | null;
  isActive: boolean;
  isFeatured: boolean;
  name: string;
  newCategoryName: string;
  partNumber: string | null;
  priceCents: number;
  quantityOnHand: number;
  reorderPoint: number;
  shortDescription: string | null;
  translationEn: { name: string | null; shortDescription: string | null; description: string | null };
  sku: string;
  slug: string;
  status: InventoryStatus;
  technicalDetails: string[];
  measurements: { weightGrams: number | null; lengthMm: number | null; widthMm: number | null; heightMm: number | null };
};

export async function createAdminProduct(formData: FormData) {
  await requireAdminRole("ADMIN");
  if (!isValidCatalogSku(formString(formData, "sku"))) redirect("/admin/products/new?estado=invalid_sku");

  const input = parseAdminProductFormData(formData);
  if (!input) redirect("/admin/products/new?estado=invalid");

  let redirectPath = "/admin/products";

  try {
    const product = await runProductWrite(async (tx) => {
      await assertSkuAvailable(tx, input.sku);
      const categoryId = await resolveCategoryId(tx, input);
      const savedProduct = await tx.product.create({
        data: {
          brand: input.brand,
          categoryId,
          currency: "USD",
          description: input.description,
          isActive: input.isActive,
          isFeatured: input.isFeatured,
          name: input.name,
          partNumber: input.partNumber,
          priceCents: input.priceCents,
          shortDescription: input.shortDescription,
          sku: input.sku,
          slug: input.slug,
          technicalDetails: input.technicalDetails as Prisma.InputJsonValue,
          ...input.measurements,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
        },
      });

      await replaceCompatibilities(tx, savedProduct.id, input.compatibilities);
      await upsertInventoryStock(tx, savedProduct.id, input);
      await saveProductTranslation(tx, savedProduct.id, "en", input.translationEn);
      await writeAdminAuditLog(tx, {
        action: "product.created",
        entityId: savedProduct.id,
        entityLabel: savedProduct.sku,
        entityType: "Product",
        metadata: buildProductAuditMetadata(input, {
          name: savedProduct.name,
          slug: savedProduct.slug,
          sku: savedProduct.sku,
        }),
      });

      return savedProduct;
    });

    revalidateProductPaths(product.slug);
    redirectPath = `/admin/products/${product.slug}/edit?estado=created`;
  } catch (error) {
    await handleAdminProductError(error, "/admin/products/new", input.sku);
  }

  redirect(redirectPath);
}

export async function updateAdminProduct(formData: FormData) {
  const productId = formString(formData, "productId");
  await requireAdminRole("ADMIN");

  const input = parseAdminProductFormData(formData);
  if (!productId) redirect(`/admin/products?estado=invalid`);

  let redirectPath = "/admin/products";
  let errorPath = "/admin/products";

  try {
    const product = await runProductWrite(async (tx) => {
      const existingProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { name: true, sku: true, slug: true },
      });

      if (!existingProduct) {
        throw new AdminProductDomainError("not_found");
      }

      // Use the persisted slug, never the attempted slug from the form.
      errorPath = `/admin/products/${encodeURIComponent(existingProduct.slug)}/edit`;
      if (!isValidCatalogSku(formString(formData, "sku"))) throw new AdminProductDomainError("invalid_sku");
      if (!input) throw new AdminProductDomainError("invalid");
      await assertSkuAvailable(tx, input.sku, productId);

      const categoryId = await resolveCategoryId(tx, input);
      const savedProduct = await tx.product.update({
        data: {
          isDemo: false,
          brand: input.brand,
          categoryId,
          description: input.description,
          isActive: input.isActive,
          isFeatured: input.isFeatured,
          name: input.name,
          partNumber: input.partNumber,
          priceCents: input.priceCents,
          shortDescription: input.shortDescription,
          sku: input.sku,
          slug: input.slug,
          technicalDetails: input.technicalDetails as Prisma.InputJsonValue,
          ...input.measurements,
        },
        where: { id: productId },
        select: {
          slug: true,
        },
      });

      await replaceCompatibilities(tx, productId, input.compatibilities);
      await upsertInventoryStock(tx, productId, input);
      await saveProductTranslation(tx, productId, "en", input.translationEn);
      await writeAdminAuditLog(tx, {
        action: "product.updated",
        entityId: productId,
        entityLabel: input.sku,
        entityType: "Product",
        metadata: buildProductAuditMetadata(input, {
          previousName: existingProduct.name,
          previousSku: existingProduct.sku,
          previousSlug: existingProduct.slug,
          slug: savedProduct.slug,
        }),
      });

      // Slug anterior: si cambió, invalidar también su tag y su path
      updateTag(productCacheTag(existingProduct.slug));
      revalidateStorefrontPath(`/product/${existingProduct.slug}`);
      return savedProduct;
    });

    revalidateProductPaths(product.slug);
    redirectPath = `/admin/products/${product.slug}/edit?estado=updated`;
  } catch (error) {
    await handleAdminProductError(error, errorPath, input?.sku ?? normalizeCatalogSku(formString(formData, "sku")), productId);
  }

  redirect(redirectPath);
}

export async function updateAdminProductInventory(formData: FormData) {
  const productId = formString(formData, "productId");
  await requireAdminRole("ADMIN");

  const quantityOnHand = parseInteger(formString(formData, "quantityOnHand"));
  const reorderPoint = parseInteger(formString(formData, "reorderPoint"));
  const requestedStatus = parseInventoryStatus(formString(formData, "status"));

  if (!productId || quantityOnHand === null || reorderPoint === null || !requestedStatus) {
    redirect("/admin/products?estado=invalid");
  }

  const status = normalizeAdminInventoryStatus({ quantityOnHand, requestedStatus });

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) redirect("/admin/products?estado=not_found");

  await db.$transaction(async (tx) => {
    const previousStock = await tx.inventoryStock.findFirst({
      where: { productId },
      select: {
        quantityOnHand: true,
        quantityReserved: true,
        reorderPoint: true,
        status: true,
      },
    });

    await upsertInventoryStock(tx, productId, {
      quantityOnHand,
      reorderPoint,
      status,
    });
    await writeAdminAuditLog(tx, {
      action: "inventory.updated",
      entityId: productId,
      entityLabel: product.slug,
      entityType: "InventoryStock",
      metadata: {
        next: { quantityOnHand, reorderPoint, status },
        previous: previousStock,
      },
    });
  });

  revalidateProductPaths(product.slug);
  redirect("/admin/products?estado_accion=stock_updated");
}

function parseAdminProductFormData(formData: FormData): AdminProductInput | null {
  const name = formString(formData, "name");
  const brand = formString(formData, "brand");
  const sku = normalizeCatalogSku(formString(formData, "sku"));
  const slug = slugifyProductValue(formString(formData, "slug") || name);
  const priceCents = parseAdminPriceCents(formString(formData, "price"));
  const quantityOnHand = parseInteger(formString(formData, "quantityOnHand"));
  const reorderPoint = parseInteger(formString(formData, "reorderPoint"));
  const requestedStatus = parseInventoryStatus(formString(formData, "status"));
  const parsedCompatibilities = parseCompatibilityLines(formString(formData, "compatibilities"));
  const measurements = parsePackageMeasurements(["weightKg", "lengthCm", "widthCm", "heightCm"].map((key) => formString(formData, key)));

  if (
    !name ||
    !brand ||
    !sku ||
    !slug ||
    priceCents === null ||
    quantityOnHand === null ||
    reorderPoint === null ||
    !requestedStatus ||
    parsedCompatibilities.invalidLines.length > 0 ||
    measurements.errors.length > 0 ||
    (formData.get("isActive") === "true" && !measurements.values)
  ) {
    return null;
  }

  return {
    brand,
    categoryId: formString(formData, "categoryId"),
    compatibilities: parsedCompatibilities.items,
    description: optionalFormStringOrNull(formData, "description"),
    isActive: formData.get("isActive") === "true",
    isFeatured: formData.get("isFeatured") === "true",
    name,
    newCategoryName: formString(formData, "newCategoryName"),
    partNumber: optionalFormStringOrNull(formData, "partNumber"),
    priceCents,
    quantityOnHand,
    reorderPoint,
    shortDescription: optionalFormStringOrNull(formData, "shortDescription"),
    sku,
    translationEn: {
      name: optionalFormStringOrNull(formData, "nameEn"),
      shortDescription: optionalFormStringOrNull(formData, "shortDescriptionEn"),
      description: optionalFormStringOrNull(formData, "descriptionEn"),
    },
    slug,
    status: normalizeAdminInventoryStatus({ quantityOnHand, requestedStatus }),
    technicalDetails: parseTechnicalDetails(formString(formData, "technicalDetails")),
    measurements: measurements.values ?? { weightGrams: null, lengthMm: null, widthMm: null, heightMm: null },
  };
}

async function resolveCategoryId(tx: Prisma.TransactionClient, input: AdminProductInput) {
  if (input.newCategoryName) {
    const category = await tx.productCategory.upsert({
      where: { slug: slugifyProductValue(input.newCategoryName) },
      update: {
        isActive: true,
        name: input.newCategoryName,
      },
      create: {
        isActive: true,
        name: input.newCategoryName,
        slug: slugifyProductValue(input.newCategoryName),
      },
      select: { id: true },
    });

    return category.id;
  }

  if (!input.categoryId) {
    throw new AdminProductDomainError("invalid");
  }

  const category = await tx.productCategory.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new AdminProductDomainError("invalid");
  }

  return category.id;
}

async function replaceCompatibilities(
  tx: Prisma.TransactionClient,
  productId: string,
  compatibilities: AdminProductInput["compatibilities"],
) {
  await tx.vehicleCompatibility.deleteMany({ where: { productId } });

  if (compatibilities.length === 0) return;

  await tx.vehicleCompatibility.createMany({
    data: compatibilities.map((compatibility) => ({
      ...compatibility,
      productId,
    })),
  });
}

async function upsertInventoryStock(
  tx: Prisma.TransactionClient,
  productId: string,
  input: Pick<AdminProductInput, "quantityOnHand" | "reorderPoint" | "status">,
) {
  const location = await tx.inventoryLocation.upsert({
    where: { code: DEFAULT_LOCATION_CODE },
    update: {
      isActive: true,
      isDefault: true,
      name: "Bodega principal",
    },
    create: {
      code: DEFAULT_LOCATION_CODE,
      isActive: true,
      isDefault: true,
      name: "Bodega principal",
    },
    select: { id: true },
  });

  await tx.inventoryStock.upsert({
    where: {
      productId_locationId: {
        locationId: location.id,
        productId,
      },
    },
    update: {
      quantityOnHand: input.quantityOnHand,
      reorderPoint: input.reorderPoint,
      status: input.status,
    },
    create: {
      locationId: location.id,
      productId,
      quantityOnHand: input.quantityOnHand,
      quantityReserved: 0,
      reorderPoint: input.reorderPoint,
      status: input.status,
    },
  });
}

function revalidateProductPaths(slug: string) {
  // Invalida el data cache del catálogo (unstable_cache en src/data/products.ts).
  // updateTag (Next 16): expiración inmediata con read-your-own-writes en actions.
  updateTag(CATALOG_CACHE_TAG);
  updateTag(productCacheTag(slug));

  revalidateStorefrontPath("/");
  revalidateStorefrontPath("/catalog");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}/edit`);
  revalidateStorefrontPath(`/product/${slug}`);
}

function buildProductAuditMetadata(
  input: AdminProductInput,
  context: Record<string, string | null>,
): Prisma.InputJsonObject {
  return {
    ...context,
    brand: input.brand,
    categoryId: input.categoryId,
    compatibilities: input.compatibilities.length,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    priceCents: input.priceCents,
    measurements: input.measurements,
    stock: {
      quantityOnHand: input.quantityOnHand,
      reorderPoint: input.reorderPoint,
      status: input.status,
    },
  };
}

async function assertSkuAvailable(tx: Prisma.TransactionClient, sku: string, productId?: string) {
  const matches = await findCatalogSkuMatches(tx, [sku], productId);
  if (matches.length) throw new AdminProductDomainError("sku_conflict", matches[0].sku);
}

async function runProductWrite<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  // Recheck the identity after a serialization retry. Even unrelated SKUs can
  // conflict because the canonical lookup takes a PostgreSQL predicate lock.
  for (let attempt = 0; ; attempt++) {
    try { return await db.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
    catch (error) {
      if (!isPrismaTransactionConflict(error) || attempt >= 2) throw error;
    }
  }
}

async function handleAdminProductError(error: unknown, fallbackPath: string, sku: string, productId?: string): Promise<never> {
  if (error instanceof AdminProductDomainError) {
    const query = new URLSearchParams({ estado: error.code });
    if (error.existingSku) query.set("sku_existente", error.existingSku);
    redirect(`${fallbackPath}?${query}`);
  }

  // A concurrent save may win after the check. Report its SKU just as clearly.
  if (isPrismaUniqueError(error) || isPrismaTransactionConflict(error)) {
    let matches: Array<{ id: string; sku: string }> = [];
    try { matches = await findCatalogSkuMatches(db, [sku], productId); }
    catch { /* Preserve the safe fallback if the database became unavailable. */ }
    if (matches.length) {
      redirect(`${fallbackPath}?${new URLSearchParams({ estado: "sku_conflict", sku_existente: matches[0].sku })}`);
    }
  }

  if (isPrismaTransactionConflict(error)) {
    redirect(`${fallbackPath}?estado=conflict`);
  }

  if (isPrismaUniqueError(error)) {
    redirect(`${fallbackPath}?estado=duplicate`);
  }

  console.error(error);
  redirect(`${fallbackPath}?estado=db_unavailable`);
}

function isPrismaTransactionConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

function isPrismaUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function parseInventoryStatus(value: string) {
  return Object.values(InventoryStatus).find((status) => status === value) ?? null;
}

function parseInteger(value: string) {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

class AdminProductDomainError extends Error {
  constructor(readonly code: "invalid" | "not_found" | "sku_conflict" | "invalid_sku", readonly existingSku?: string) {
    super(code);
  }
}

/**
 * Guarda o borra la traducción de un producto.
 *
 * Si los tres campos quedan vacíos se borra la fila entera en vez de guardar
 * nulos: una fila de traducción sin contenido no aporta nada y ensucia el
 * `include` de cada lectura del catálogo.
 */
async function saveProductTranslation(
  tx: Prisma.TransactionClient,
  productId: string,
  locale: string,
  translation: AdminProductInput["translationEn"],
) {
  const hasContent = Object.values(translation).some((value) => value != null);

  if (!hasContent) {
    await tx.productTranslation.deleteMany({ where: { productId, locale } });
    return;
  }

  await tx.productTranslation.upsert({
    where: { productId_locale: { productId, locale } },
    update: translation,
    create: { productId, locale, ...translation },
  });
}
