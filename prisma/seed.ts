import { InventoryStatus, PrismaClient } from "@prisma/client";
import { mockProducts } from "../src/data/mock-products";

const prisma = new PrismaClient();

const DEFAULT_LOCATION_CODE = "MAIN";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toInventoryStatus(status: string) {
  if (status === "En stock") return InventoryStatus.IN_STOCK;
  if (status === "Bajo stock") return InventoryStatus.LOW_STOCK;
  return InventoryStatus.PREORDER;
}

function parseVehicle(value: string) {
  const match = value.match(/^([A-Za-z]+)\s+(.+)\s+(\d{4})-(\d{4})$/);

  if (!match) {
    return null;
  }

  return {
    make: match[1],
    model: match[2],
    yearFrom: Number(match[3]),
    yearTo: Number(match[4]),
  };
}

async function main() {
  const location = await prisma.inventoryLocation.upsert({
    where: { code: DEFAULT_LOCATION_CODE },
    update: {
      name: "Bodega principal",
      isDefault: true,
      isActive: true,
    },
    create: {
      code: DEFAULT_LOCATION_CODE,
      name: "Bodega principal",
      isDefault: true,
      isActive: true,
    },
  });

  for (const [index, category] of Array.from(new Set(mockProducts.map((product) => product.category))).entries()) {
    await prisma.productCategory.upsert({
      where: { slug: slugify(category) },
      update: {
        name: category,
        isActive: true,
        sortOrder: index,
      },
      create: {
        name: category,
        slug: slugify(category),
        isActive: true,
        sortOrder: index,
      },
    });
  }

  for (const product of mockProducts) {
    const category = await prisma.productCategory.findUniqueOrThrow({
      where: { slug: slugify(product.category) },
    });

    const savedProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        partNumber: product.partNumber,
        shortDescription: product.compatibility,
        description: product.description,
        technicalDetails: product.technicalDetails,
        categoryId: category.id,
        priceCents: product.priceCents,
        currency: "USD",
        isActive: true,
        isFeatured: true,
      },
      create: {
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        sku: product.sku,
        partNumber: product.partNumber,
        shortDescription: product.compatibility,
        description: product.description,
        technicalDetails: product.technicalDetails,
        categoryId: category.id,
        priceCents: product.priceCents,
        currency: "USD",
        isActive: true,
        isFeatured: true,
      },
    });

    await prisma.vehicleCompatibility.deleteMany({
      where: { productId: savedProduct.id },
    });

    const compatibilities = product.compatibleVehicles
      .map(parseVehicle)
      .filter((compatibility): compatibility is NonNullable<ReturnType<typeof parseVehicle>> =>
        Boolean(compatibility),
      );

    if (compatibilities.length > 0) {
      await prisma.vehicleCompatibility.createMany({
        data: compatibilities.map((compatibility) => ({
          ...compatibility,
          productId: savedProduct.id,
        })),
      });
    }

    await prisma.inventoryStock.upsert({
      where: {
        productId_locationId: {
          productId: savedProduct.id,
          locationId: location.id,
        },
      },
      update: {
        quantityOnHand: product.stockQuantity,
        status: toInventoryStatus(product.stockStatus),
      },
      create: {
        productId: savedProduct.id,
        locationId: location.id,
        quantityOnHand: product.stockQuantity,
        quantityReserved: 0,
        reorderPoint: 2,
        status: toInventoryStatus(product.stockStatus),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
