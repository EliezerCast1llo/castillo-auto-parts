import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * Prefijo de idioma del storefront.
 *
 * Los tests navegan a la URL prefijada a proposito, en vez de apoyarse en el
 * redirect: asi ejercitan la misma URL que ve el usuario, evitan un salto extra
 * en cada navegacion y las aserciones de `toHaveURL` no quedan ambiguas.
 */
export const ES = (path: string) => (path === "/" ? "/es" : `/es${path}`);
export const EN = (path: string) => (path === "/" ? "/en" : `/en${path}`);
/**
 * Único cliente Prisma de los specs e2e.
 *
 * Cada spec corre en su propio worker, que es un proceso aparte, así que cada
 * uno recibe su propia instancia de este módulo: hacer `$disconnect()` en un
 * spec no afecta a los demás. Por eso cada spec que lo usa lo cierra en su
 * `afterAll`, y esa es la regla — antes convivían cinco clientes contra la
 * misma base, cuatro cerrándose y uno no.
 */
export const prisma = new PrismaClient();

export async function addProductToCart(page: Page, slug: string) {
  await page.goto(ES(`/product/${slug}`));
  await page.getByRole("button", { exact: true, name: "Agregar al carrito" }).click();
  await expect(page.getByText("Repuesto agregado al carrito")).toBeVisible();
  await page.goto(ES("/cart"));
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
