import { expect, test, type Page } from "@playwright/test";
import { InventoryStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("catalog search filters products", async ({ page }) => {
  await page.goto("/catalog?q=toyota");

  await expect(page.getByRole("heading", { name: "Catálogo de repuestos" })).toBeVisible();
  await expect(page.getByText("Filtro de aceite para Toyota 1.8L")).toBeVisible();
});

test("customer can add an available product to the guest cart", async ({ page }) => {
  await page.goto("/catalog");

  await page.getByRole("button", { name: "Agregar" }).first().click();

  await expect(page).toHaveURL(/\/cart\?estado=added/);
  await expect(page.getByRole("heading", { name: "Tu carrito" })).toBeVisible();
  await expect(page.getByText("Producto agregado al carrito.")).toBeVisible();
});

test("local delivery checkout exposes delivery zone and map fields", async ({ page }) => {
  await page.goto("/catalog");

  await page.getByRole("button", { name: "Agregar" }).first().click();
  await page.getByRole("link", { name: "Continuar al pago" }).click();
  await page.locator('input[value="LOCAL_DELIVERY"]').click();
  await page.locator('select[name="deliveryZoneSlug"]').selectOption("santa-tecla");
  await page.locator('input[name="addressLine1"]').fill("Residencial prueba, Santa Tecla");
  await page.locator('input[name="latitude"]').fill("13.676900");
  await page.locator('input[name="longitude"]').fill("-89.279700");

  await expect(page.getByRole("heading", { name: "Ubicación exacta" })).toBeVisible();
  await expect(page.locator('select[name="deliveryZoneSlug"]')).toHaveValue("santa-tecla");
  await expect(page.locator('input[readonly]').first()).toHaveValue("La Libertad");
});

test("guest can complete pickup checkout with simulated online payment", async ({ page }) => {
  await addProductToCart(page, "bujia-iridio-hyundai-kia-16l");
  await page.getByRole("link", { name: "Continuar al pago" }).click();

  await fillCustomerFields(page, {
    email: "qa-pickup@example.com",
    name: "Cliente QA Retiro",
    phone: "7777-1000",
  });

  await expect(page.getByRole("heading", { name: "Retiro en bodega" })).toBeVisible();
  await expect(page.locator('iframe[title="Ubicación de bodega"]')).toBeVisible();

  await page.getByRole("button", { name: "Confirmar y pagar" }).click();

  await expect(page).toHaveURL(/\/orders\/CAP-\d{8}-[A-Z0-9]{6}\?token=/);
  await expect(page.getByText("Orden creada")).toBeVisible();
  await expect(page.getByText("Estado actual: pendiente de entrega.")).toBeVisible();
  await expect(page.getByText("Retiro en bodega").first()).toBeVisible();
  await expect(page.getByText("Pago confirmado")).toBeVisible();
});

test("guest can complete local delivery checkout with zone and exact location", async ({ page }) => {
  await addProductToCart(page, "refrigerante-premix-1-galon");
  await page.getByRole("link", { name: "Continuar al pago" }).click();

  await fillCustomerFields(page, {
    email: "qa-delivery@example.com",
    name: "Cliente QA Envío",
    phone: "7777-2000",
  });
  await page.locator('input[value="LOCAL_DELIVERY"]').check();
  await page.getByLabel("Dirección").fill("Colonia Escalón, San Salvador");
  await page.getByLabel("Municipio").selectOption("san-salvador");
  await page.getByLabel("Notas de entrega").fill("Entregar en recepción.");
  await page.getByLabel("Latitud").fill("13.700000");
  await page.getByLabel("Longitud").fill("-89.220000");

  await expect(page.getByRole("heading", { name: "Ubicación exacta" })).toBeVisible();
  await expect(page.getByText("Total estimado")).toBeVisible();

  await page.getByRole("button", { name: "Confirmar y pagar" }).click();

  await expect(page).toHaveURL(/\/orders\/CAP-\d{8}-[A-Z0-9]{6}\?token=/);
  await expect(page.getByText("Orden creada")).toBeVisible();
  await expect(page.getByText("Envío local")).toBeVisible();
  await expect(page.getByText("San Salvador").first()).toBeVisible();
  await expect(page.getByText("$3.00")).toBeVisible();
  await expect(page.getByText("Pago confirmado")).toBeVisible();
});

test("guest can request a stock alert when cart item becomes unavailable", async ({ page }) => {
  const sku = "MOCK-FIL-TOY-18";
  const alertEmail = "qa-stock-alert@example.com";

  await addProductToCart(page, "filtro-aceite-toyota-18l");
  await makeProductUnavailable(sku);
  await page.goto("/cart");

  await expect(page.getByText("Este producto ya no está disponible.")).toBeVisible();
  await page.getByPlaceholder("Email para aviso").fill(alertEmail);
  await page.getByRole("button", { name: "Avisarme" }).click();

  await expect(page).toHaveURL(/\/cart\?estado=stock_alert_created/);
  await expect(
    page.getByText("Listo. Te avisamos cuando haya disponibilidad."),
  ).toBeVisible();
  await expect
    .poll(() =>
      prisma.stockAlertRequest.count({
        where: {
          email: alertEmail,
          skuSnapshot: sku,
          status: "OPEN",
        },
      }),
    )
    .toBe(1);
});

async function addProductToCart(page: Page, slug: string) {
  await page.goto(`/product/${slug}`);
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page).toHaveURL(/\/cart\?estado=added/);
}

async function fillCustomerFields(
  page: Page,
  customer: { email: string; name: string; phone: string },
) {
  await expect(page.getByRole("heading", { name: "Datos de entrega y pago" })).toBeVisible();
  await page.getByLabel("Nombre completo").fill(customer.name);
  await page.getByLabel("Email").fill(customer.email);
  await page.getByLabel("Teléfono").fill(customer.phone);
}

async function makeProductUnavailable(sku: string) {
  const product = await prisma.product.findUniqueOrThrow({
    select: { id: true },
    where: { sku },
  });

  await prisma.inventoryStock.updateMany({
    data: {
      quantityOnHand: 0,
      status: InventoryStatus.OUT_OF_STOCK,
    },
    where: { productId: product.id },
  });
}
