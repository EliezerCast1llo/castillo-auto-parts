import { InventoryStatus, PrismaClient } from "@prisma/client";
import type { StockStatus } from "../src/lib/stock-status";
import { mockProducts } from "../src/data/mock-products";
import { hashPassword } from "../src/lib/admin-credentials";

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

/**
 * El estado de la app tiene tres valores y el enum de Prisma cuatro; PREORDER
 * no se siembra, así que el resto cae en OUT_OF_STOCK.
 */
/**
 * Traducciones al ingles de las categorias. Todas, porque son once y se ven en
 * los filtros de cada pagina del catalogo.
 */
const CATEGORY_EN: Record<string, string> = {
  Filtros: "Filters",
  Frenos: "Brakes",
  "Bujías": "Spark plugs",
  Escobillas: "Wiper blades",
  Focos: "Bulbs",
  Fluidos: "Fluids",
  "Suspensión": "Suspension",
  "Baterías": "Batteries",
  Correas: "Belts",
  Enfriamiento: "Cooling",
  "Eléctrico": "Electrical",
};

/**
 * Traducciones de producto para un subconjunto representativo.
 *
 * A proposito no estan todos: sirve para que el smoke en ingles sea real y,
 * sobre todo, para dejar vivo el caso de fallback —producto sin traduccion,
 * que debe mostrarse en espanol dentro de una pagina en ingles— que es lo que
 * hay que poder mirar en QA.
 */
const PRODUCT_EN: Record<string, { name: string; shortDescription?: string; description?: string }> = {
  "filtro-aceite-toyota-18l": {
    name: "Toyota 1.8L oil filter",
    description:
      "Oil filter for Toyota 1.8L engines. Replace it with every oil change to keep the lubrication circuit clean.",
  },
  "pastillas-freno-delanteras-toyota-corolla": {
    name: "Toyota Corolla front brake pads",
    description: "Front brake pads for Toyota Corolla. Check the discs when you replace them.",
  },
  "bujia-iridio-hyundai-kia-16l": {
    name: "Hyundai/Kia 1.6L iridium spark plug",
    description: "Iridium spark plug for Hyundai and Kia 1.6L engines. Longer service life than copper.",
  },
  "refrigerante-premix-1-galon": {
    name: "Pre-mixed coolant, 1 gallon",
    description: "Ready-to-use pre-mixed coolant. No dilution needed.",
  },
  "escobilla-universal-22-pulgadas": {
    name: "Universal wiper blade, 22 inches",
    // Con descripcion corta a proposito: es el unico camino por el que ese
    // campo se ve en la tienda —sustituye a la compatibilidad cuando el
    // producto no tiene vehiculos cargados— y sin una fila asi la traduccion
    // se guardaba y no se mostraba en ningun lado sin que nada avisara.
    shortDescription: "Universal by size",
    description: "Universal 22-inch wiper blade with a multi-adapter mount.",
  },
  "bateria-12v-65ah": {
    name: "12V 65Ah battery",
    description: "Sealed 12V 65Ah battery, maintenance free.",
  },
};

function toInventoryStatus(status: StockStatus) {
  if (status === "IN_STOCK") return InventoryStatus.IN_STOCK;
  if (status === "LOW_STOCK") return InventoryStatus.LOW_STOCK;
  return InventoryStatus.OUT_OF_STOCK;
}

async function seedAdminUser() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim();
  const password = process.env.ADMIN_SEED_PASSWORD?.trim();

  if (!email || !password) {
    console.log("ℹ  ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD no definidos — omitiendo seed de usuario admin.");
    return;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true, role: "ADMIN" },
    create: {
      email,
      name: "Administrador",
      role: "ADMIN",
      passwordHash,
      isActive: true,
    },
  });

  console.log(`✔  Usuario admin seedeado: ${email}`);
}

async function main() {
  await seedAdminUser();

  const location = await prisma.inventoryLocation.upsert({
    where: { code: DEFAULT_LOCATION_CODE },
    update: {
      address: "Bodega principal, San Salvador, El Salvador",
      isDefault: true,
      isActive: true,
      latitude: 13.6929,
      longitude: -89.2182,
      name: "Bodega principal",
      pickupHours: "Lunes a sábado, 8:00 a. m. a 5:00 p. m.",
      pickupInstructions: "Presenta tu número de orden al llegar a bodega.",
    },
    create: {
      address: "Bodega principal, San Salvador, El Salvador",
      code: DEFAULT_LOCATION_CODE,
      isDefault: true,
      isActive: true,
      latitude: 13.6929,
      longitude: -89.2182,
      name: "Bodega principal",
      pickupHours: "Lunes a sábado, 8:00 a. m. a 5:00 p. m.",
      pickupInstructions: "Presenta tu número de orden al llegar a bodega.",
    },
  });

  await prisma.deliveryZone.upsert({
    where: { slug: "santa-tecla" },
    update: {
      city: "Santa Tecla",
      department: "La Libertad",
      feeCents: 200,
      isActive: true,
      name: "Santa Tecla",
      sortOrder: 1,
    },
    create: {
      city: "Santa Tecla",
      department: "La Libertad",
      feeCents: 200,
      isActive: true,
      name: "Santa Tecla",
      slug: "santa-tecla",
      sortOrder: 1,
    },
  });

  await prisma.deliveryZone.upsert({
    where: { slug: "san-salvador" },
    update: {
      city: "San Salvador",
      department: "San Salvador",
      feeCents: 300,
      isActive: true,
      name: "San Salvador",
      sortOrder: 2,
    },
    create: {
      city: "San Salvador",
      department: "San Salvador",
      feeCents: 300,
      isActive: true,
      name: "San Salvador",
      slug: "san-salvador",
      sortOrder: 2,
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

    const categoryEn = CATEGORY_EN[category];
    if (categoryEn) {
      const stored = await prisma.productCategory.findUniqueOrThrow({
        where: { slug: slugify(category) },
      });
      await prisma.productCategoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: stored.id, locale: "en" } },
        update: { name: categoryEn },
        create: { categoryId: stored.id, locale: "en", name: categoryEn },
      });
    }
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

    const productEn = PRODUCT_EN[product.slug];
    if (productEn) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: savedProduct.id, locale: "en" } },
        update: productEn,
        create: { productId: savedProduct.id, locale: "en", ...productEn },
      });
    }

    await prisma.vehicleCompatibility.deleteMany({
      where: { productId: savedProduct.id },
    });

    const compatibilities = product.vehicleCompatibilities;

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
