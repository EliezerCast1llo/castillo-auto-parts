import { expect, test, type Page } from "@playwright/test";
import { ES } from "./helpers";
import { PRODUCT_CLAIMS } from "./fixtures/products";

// La reserva de productos de este spec; ver fixtures/products.ts.
const CLAIMS = PRODUCT_CLAIMS["catalog-cart.spec.ts"];
import { InventoryStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("catalog search filters products", async ({ page }) => {
  await page.goto(ES("/catalog?q=toyota"));

  await expect(page.getByRole("heading", { name: "Catálogo de repuestos" })).toBeVisible();
  await expect(page.getByText("Filtro de aceite para Toyota 1.8L")).toBeVisible();
});

test("legacy Spanish stock URLs redirect to the canonical identifier", async ({ page }) => {
  // `/catalog?stock=Últimas unidades` viajó en la navegación del sitio, así que
  // sigue circulando en historiales, bookmarks y buscadores.
  await page.goto(ES("/catalog?stock=Últimas unidades"));

  await expect(page).toHaveURL(/\/catalog\?stock=LOW_STOCK$/);
  await expect(page.getByRole("heading", { name: "Catálogo de repuestos" })).toBeVisible();
});

test("canonical stock URLs are served without redirecting", async ({ page }) => {
  await page.goto(ES("/catalog?stock=IN_STOCK"));

  await expect(page).toHaveURL(/\/catalog\?stock=IN_STOCK$/);
  await expect(page.getByRole("heading", { name: "Catálogo de repuestos" })).toBeVisible();
});

test("the availability filter shows Spanish labels but submits identifiers", async ({ page }) => {
  await page.goto(ES("/catalog"));

  // El label es texto para el cliente; el value del checkbox es el
  // identificador de dominio. Confundirlos rompe una de las dos cosas.
  const availability = page.getByRole("group", { name: "Disponibilidad" });
  await expect(availability.getByText("Disponible", { exact: true })).toBeVisible();
  await expect(availability.getByText("IN_STOCK")).toHaveCount(0);

  await availability.getByRole("checkbox", { name: "Disponible", exact: true }).check();
  await expect(page).toHaveURL(/\/catalog\?.*stock=IN_STOCK/);

  // Y el chip del filtro activo tambien se muestra traducido.
  await expect(page.getByText("Disponibilidad: Disponible")).toBeVisible();
  await expect(page.getByText("Disponibilidad: IN_STOCK")).toHaveCount(0);
});

test("multi-select filters keep every checked value", async ({ page }) => {
  await page.goto(ES("/catalog"));

  const categories = page.getByRole("group", { name: "Categoría" });
  const boxes = categories.locator('input[name="category"]');
  const first = (await boxes.nth(0).getAttribute("value"))!;
  const second = (await boxes.nth(1).getAttribute("value"))!;

  // El identificador y la etiqueta son dos cosas distintas: el checkbox manda
  // el slug ("baterias") y el chip muestra el nombre ("Baterías"). Armar el
  // texto del chip con el value hacia que este test buscara un enlace que no
  // existe.
  const firstLabel = (await categories.locator("label").nth(0).locator("span").first().textContent())!.trim();

  // El form navega en cada cambio, asi que hay que esperar cada navegacion
  // antes de tocar el siguiente checkbox: si no, el segundo click cae sobre un
  // DOM que se esta reemplazando.
  // Se localiza por el atributo `value`: el nombre accesible incluye el conteo
  // de resultados ("Baterías (5)"), que cambia con los filtros activos.
  await categories.locator(`input[value="${first}"]`).check();
  await expect(page).toHaveURL(new RegExp(`category=${encodeURIComponent(first)}`));

  await categories.locator(`input[value="${second}"]`).check();
  await expect(page).toHaveURL(new RegExp(`category=${encodeURIComponent(second)}`));

  // Aplanar la query con Object.fromEntries se queda solo con el ultimo valor
  // de cada clave repetida: marcar dos categorias filtraria por una sola.
  expect(new URL(page.url()).searchParams.getAll("category")).toEqual([first, second]);

  // Y quitar un filtro no debe descartar el otro.
  await page.getByRole("link", { name: `Quitar filtro Categoría: ${firstLabel}` }).click();
  await expect(page).not.toHaveURL(new RegExp(`category=${encodeURIComponent(first)}`));
  expect(new URL(page.url()).searchParams.getAll("category")).toEqual([second]);
});

test("customer can add an available product to the guest cart", async ({ page }) => {
  await page.goto(ES("/catalog"));

  await page.getByRole("button", { name: "Agregar" }).first().click();

  // Sin redirect: toast de confirmación, el usuario permanece en el catálogo
  // y el contador del header se actualiza.
  await expect(page.getByText("Repuesto agregado al carrito")).toBeVisible();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByRole("link", { name: /Ver carrito, 1 producto/ })).toBeVisible();

  await page.getByRole("link", { name: /Ver carrito, 1 producto/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("heading", { name: "Tu carrito" })).toBeVisible();
  await expect(page.getByText("1 producto").first()).toBeVisible();
});

test("local delivery checkout exposes delivery zone and map fields", async ({ page }) => {
  await page.goto(ES("/catalog"));

  await page.getByRole("button", { name: "Agregar" }).first().click();
  await expect(page.getByText("Repuesto agregado al carrito")).toBeVisible();
  await page.getByRole("link", { name: /Ver carrito, 1 producto/ }).click();
  await page.getByRole("link", { name: "Continuar al pago" }).click();
  await page.locator('input[value="LOCAL_DELIVERY"]').click();
  await page.locator('select[name="deliveryZoneSlug"]').selectOption("santa-tecla");
  await page.locator('input[name="addressLine1"]').fill("Residencial prueba, Santa Tecla");

  await expect(page.getByRole("button", { name: "Usar mi ubicación" })).toBeVisible();
  await expect(page.locator('select[name="deliveryZoneSlug"]')).toHaveValue("santa-tecla");
  await expect(page.locator('input[readonly]').first()).toHaveValue("La Libertad");
});

test("guest can create a pickup order awaiting payment confirmation", async ({ page }) => {
  const { sku, slug } = CLAIMS.pickupOrder;
  const initialStock = await getStockSnapshot(sku);

  await addProductToCart(page, slug);
  await page.getByRole("link", { name: "Continuar al pago" }).click();

  await fillCustomerFields(page, {
    email: "qa-pickup@example.com",
    name: "Cliente QA Retiro",
    phone: "7777-1000",
  });

  await expect(page.getByRole("heading", { name: "Retiro en bodega" })).toBeVisible();
  await expect(page.locator('iframe[title="Ubicación de bodega"]')).toBeVisible();

  await page.getByRole("button", { name: "Confirmar y pagar" }).click();

  await expect(page).toHaveURL(/\/payments\/mock\/MOCK-CAP-/);
  await expect(page.getByRole("heading", { name: "Simulación de pago" })).toBeVisible();

  const order = await prisma.order.findFirstOrThrow({
    include: { payment: true },
    orderBy: { createdAt: "desc" },
    where: { customerEmail: "qa-pickup@example.com" },
  });
  const reservedStock = await getStockSnapshot(sku);

  expect(order.status).toBe("PAYMENT_PROCESSING");
  expect(order.payment?.status).toBe("PENDING");
  expect(order.paidAt).toBeNull();
  expect(reservedStock.quantityOnHand).toBe(initialStock.quantityOnHand);
  expect(reservedStock.quantityReserved).toBe(initialStock.quantityReserved + 1);

  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(page).toHaveURL(/\/orders\/CAP-\d{8}-[A-Z0-9]{6}\?token=/);
  await expect(page.getByText("Orden creada")).toBeVisible();
  await expect(page.getByText("Estado actual: pendiente de entrega.")).toBeVisible();
  await expect(page.getByText("Retiro en bodega").first()).toBeVisible();

  const paidOrder = await prisma.order.findUniqueOrThrow({
    include: { payment: true },
    where: { id: order.id },
  });
  const confirmedStock = await getStockSnapshot(sku);
  expect(paidOrder.status).toBe("PAID_PENDING_SHIPMENT");
  expect(paidOrder.payment?.status).toBe("PAID");
  expect(confirmedStock.quantityOnHand).toBe(initialStock.quantityOnHand - 1);
  expect(confirmedStock.quantityReserved).toBe(initialStock.quantityReserved);
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
  // Coordenadas seteadas directamente en los hidden inputs (el mapa las escribe via ref)
  await page.evaluate(() => {
    const lat = document.querySelector('input[name="latitude"]') as HTMLInputElement | null;
    const lng = document.querySelector('input[name="longitude"]') as HTMLInputElement | null;
    if (lat) lat.value = "13.700000";
    if (lng) lng.value = "-89.220000";
  });

  await expect(page.getByRole("button", { name: "Usar mi ubicación" })).toBeVisible();
  await expect(page.getByText("Total estimado")).toBeVisible();

  await page.getByRole("button", { name: "Confirmar y pagar" }).click();

  await expect(page).toHaveURL(/\/payments\/mock\/MOCK-CAP-/);
  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(page).toHaveURL(/\/orders\/CAP-\d{8}-[A-Z0-9]{6}\?token=/);
  await expect(page.getByText("Orden creada")).toBeVisible();
  await expect(page.getByText("Envío local")).toBeVisible();
  await expect(page.getByText("San Salvador").first()).toBeVisible();
  await expect(page.getByText("$3.00")).toBeVisible();
  await expect(page.getByText("Estado actual: pendiente de entrega.")).toBeVisible();

  const paidOrder = await prisma.order.findFirstOrThrow({
    include: { payment: true },
    orderBy: { createdAt: "desc" },
    where: { customerEmail: "qa-delivery@example.com" },
  });
  expect(paidOrder.status).toBe("PAID_PENDING_SHIPMENT");
  expect(paidOrder.payment?.status).toBe("PAID");
});

test("guest can request a stock alert when cart item becomes unavailable", async ({ page }) => {
  const { sku, slug } = CLAIMS.stockAlert;
  const alertEmail = "qa-stock-alert@example.com";

  await addProductToCart(page, slug);
  await makeProductUnavailable(sku);
  await page.goto(ES("/cart"));

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
  await page.goto(ES(`/product/${slug}`));
  await page.getByRole("button", { exact: true, name: "Agregar al carrito" }).click();
  await expect(page.getByText("Repuesto agregado al carrito")).toBeVisible();
  await page.goto(ES("/cart"));
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

async function getStockSnapshot(sku: string) {
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
