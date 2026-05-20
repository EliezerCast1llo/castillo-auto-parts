"use server";

import { InventoryStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeAdminInventoryStatus,
  parseAdminPriceCents,
  parseCompatibilityLines,
  parseTechnicalDetails,
  slugifyProductValue,
} from "@/lib/admin-products";
import { requireAdminAccess } from "@/lib/admin-auth";
import { db } from "@/lib/db";

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
  sku: string;
  slug: string;
  status: InventoryStatus;
  technicalDetails: string[];
};

export async function createAdminProduct(formData: FormData) {
  await requireAdminAccess("/admin/products/new");

  const input = parseAdminProductFormData(formData);
  if (!input) redirect("/admin/products/new?estado=invalid");

  let redirectPath = "/admin/products";

  try {
    const product = await db.$transaction(async (tx) => {
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
        },
        select: {
          id: true,
          slug: true,
        },
      });

      await replaceCompatibilities(tx, savedProduct.id, input.compatibilities);
      await upsertInventoryStock(tx, savedProduct.id, input);

      return savedProduct;
    });

    revalidateProductPaths(product.slug);
    redirectPath = `/admin/products/${product.slug}/edit?estado=created`;
  } catch (error) {
    handleAdminProductError(error, "/admin/products/new");
  }

  redirect(redirectPath);
}

export async function updateAdminProduct(formData: FormData) {
  const productId = formString(formData, "productId");
  await requireAdminAccess(productId ? "/admin/products" : "/admin/products/new");

  const input = parseAdminProductFormData(formData);
  if (!productId || !input) redirect(`/admin/products?estado=invalid`);

  let redirectPath = "/admin/products";

  try {
    const product = await db.$transaction(async (tx) => {
      const existingProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { slug: true },
      });

      if (!existingProduct) {
        throw new AdminProductDomainError("not_found");
      }

      const categoryId = await resolveCategoryId(tx, input);
      const savedProduct = await tx.product.update({
        data: {
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
        },
        where: { id: productId },
        select: {
          slug: true,
        },
      });

      await replaceCompatibilities(tx, productId, input.compatibilities);
      await upsertInventoryStock(tx, productId, input);

      revalidatePath(`/product/${existingProduct.slug}`);
      return savedProduct;
    });

    revalidateProductPaths(product.slug);
    redirectPath = `/admin/products/${product.slug}/edit?estado=updated`;
  } catch (error) {
    handleAdminProductError(error, "/admin/products");
  }

  redirect(redirectPath);
}

export async function updateAdminProductInventory(formData: FormData) {
  const productId = formString(formData, "productId");
  await requireAdminAccess("/admin/products");

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
    await upsertInventoryStock(tx, productId, {
      quantityOnHand,
      reorderPoint,
      status,
    });
  });

  revalidateProductPaths(product.slug);
  redirect("/admin/products?estado_accion=stock_updated");
}

function parseAdminProductFormData(formData: FormData): AdminProductInput | null {
  const name = formString(formData, "name");
  const brand = formString(formData, "brand");
  const sku = formString(formData, "sku");
  const slug = slugifyProductValue(formString(formData, "slug") || name);
  const priceCents = parseAdminPriceCents(formString(formData, "price"));
  const quantityOnHand = parseInteger(formString(formData, "quantityOnHand"));
  const reorderPoint = parseInteger(formString(formData, "reorderPoint"));
  const requestedStatus = parseInventoryStatus(formString(formData, "status"));
  const parsedCompatibilities = parseCompatibilityLines(formString(formData, "compatibilities"));

  if (
    !name ||
    !brand ||
    !sku ||
    !slug ||
    priceCents === null ||
    quantityOnHand === null ||
    reorderPoint === null ||
    !requestedStatus ||
    parsedCompatibilities.invalidLines.length > 0
  ) {
    return null;
  }

  return {
    brand,
    categoryId: formString(formData, "categoryId"),
    compatibilities: parsedCompatibilities.items,
    description: optionalFormString(formData, "description"),
    isActive: formData.get("isActive") === "true",
    isFeatured: formData.get("isFeatured") === "true",
    name,
    newCategoryName: formString(formData, "newCategoryName"),
    partNumber: optionalFormString(formData, "partNumber"),
    priceCents,
    quantityOnHand,
    reorderPoint,
    shortDescription: optionalFormString(formData, "shortDescription"),
    sku,
    slug,
    status: normalizeAdminInventoryStatus({ quantityOnHand, requestedStatus }),
    technicalDetails: parseTechnicalDetails(formString(formData, "technicalDetails")),
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
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}/edit`);
  revalidatePath(`/product/${slug}`);
}

function handleAdminProductError(error: unknown, fallbackPath: string): never {
  if (error instanceof AdminProductDomainError) {
    redirect(`${fallbackPath}?estado=${error.code}`);
  }

  if (isPrismaUniqueError(error)) {
    redirect(`${fallbackPath}?estado=duplicate`);
  }

  console.error(error);
  redirect(`${fallbackPath}?estado=db_unavailable`);
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

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormString(formData: FormData, key: string) {
  return formString(formData, key) || null;
}

class AdminProductDomainError extends Error {
  constructor(readonly code: "invalid" | "not_found") {
    super(code);
  }
}
