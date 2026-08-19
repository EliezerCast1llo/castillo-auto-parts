import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Cliente Prisma compartido para specs e2e. Cada spec corre en su propio worker
// (proceso), así que cada uno obtiene su propia instancia; hacer $disconnect en un
// spec no afecta a otros.
export const prisma = new PrismaClient();

export async function addProductToCart(page: Page, slug: string) {
  await page.goto(`/product/${slug}`);
  await page.getByRole("button", { exact: true, name: "Agregar al carrito" }).click();
  await expect(page.getByText("Repuesto agregado al carrito")).toBeVisible();
  await page.goto("/cart");
}

export async function fillCustomerFields(
  page: Page,
  customer: { email: string; name: string; phone: string },
) {
  await expect(page.getByRole("heading", { name: "Datos de entrega y pago" })).toBeVisible();
  await page.getByLabel("Nombre completo").fill(customer.name);
  await page.getByLabel("Email").fill(customer.email);
  await page.getByLabel("Teléfono").fill(customer.phone);
}

export async function getStockSnapshot(sku: string) {
  return prisma.inventoryStock.findFirstOrThrow({
    select: {
      quantityOnHand: true,
      quantityReserved: true,
    },
    where: {
      product: { sku },
    },
  });
}
