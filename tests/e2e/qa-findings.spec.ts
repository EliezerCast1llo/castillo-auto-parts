import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prisma } from "./helpers";

test.afterAll(async () => { await prisma.$disconnect(); });

test("global 404 has a localized document, title and links", async ({ page }) => {
  for (const [locale, title, catalog] of [["es", "Página no encontrada", "/es/catalog"], ["en", "Page not found", "/en/catalog"]]) {
    const response = await page.goto(`/${locale}/missing-qa138-route`);
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page).toHaveTitle(new RegExp("404|" + title));
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.locator(`a[href="${catalog}"]`)).toBeVisible();
  }
});

test("private pages do not inherit the homepage canonical", async ({ page }) => {
  for (const path of ["/es/cart", "/es/checkout", "/es/auth/login", "/es/auth/register"]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("OPTIONS pages respond explicitly without redirects or sessions", async ({ request }) => {
  for (const path of ["/es/catalog", "/admin/orders"]) {
    const response = await request.fetch(path, { method: "OPTIONS", maxRedirects: 0 });
    expect(response.status()).toBe(204);
    expect(response.headers().allow).toContain("OPTIONS");
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
});

test("a deactivated product is not purchasable in a production build", async ({ page }) => {
  const slug = `qa138-${randomUUID()}`;
  const category = await prisma.productCategory.findFirstOrThrow();
  const product = await prisma.product.create({ data: { sku: slug.toUpperCase(), slug, name: "Inactive QA fixture", brand: "QA", categoryId: category.id, priceCents: 100, isActive: false } });
  try {
    await page.goto(`/es/product/${slug}`);
    await expect(page.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Agregar al carrito", exact: true })).toHaveCount(0);
  } finally { await prisma.product.delete({ where: { id: product.id } }); }
});

test("autocomplete renders stock status without missing client messages", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/es/catalog");
  const input = page.getByRole("combobox").first();
  await input.fill("filtro");
  await expect(page.getByRole("listbox")).toBeVisible();
  expect(errors.filter(error => error.includes("MISSING_MESSAGE"))).toEqual([]);
});

test("mock rejection releases reservations and fails payment without a locale redirect", async ({ page }) => {
  const suffix = randomUUID().slice(0, 8), number = `CAP-20990101-${suffix.toUpperCase()}`;
  const category = await prisma.productCategory.findFirstOrThrow();
  const location = await prisma.inventoryLocation.findFirstOrThrow({ where: { code: "MAIN" } });
  const product = await prisma.product.create({ data: { sku: `QA138-${suffix}`, slug: `qa138-pay-${suffix}`, name: "Payment fixture", brand: "QA", categoryId: category.id, priceCents: 100 } });
  const stock = await prisma.inventoryStock.create({ data: { productId: product.id, locationId: location.id, quantityOnHand: 5, quantityReserved: 1 } });
  const order = await prisma.order.create({ data: { orderNumber: number, customerEmail: "rejected-qa@example.com", customerName: "QA", customerPhone: "77771000", status: "PAYMENT_PROCESSING", subtotalCents: 100, taxCents: 0, shippingCents: 0, totalCents: 100, payment: { create: { provider: "mock", externalPaymentId: `MOCK-${number}`, amountCents: 100 } }, items: { create: { productId: product.id, productNameSnapshot: "QA", skuSnapshot: product.sku, brandSnapshot: "QA", quantity: 1, unitPriceCents: 100, lineTotalCents: 100, taxCents: 0 } } } });
  try {
    const returnTo = new URL(`/es/orders/${number}`, process.env.PLAYWRIGHT_BASE_URL).toString();
    const response = await page.goto(`/es/payments/mock/MOCK-${number}?returnTo=${encodeURIComponent(returnTo)}`);
    expect(response?.request().redirectedFrom()).toBeNull();
    await page.getByRole("button", { name: "Simular pago rechazado" }).click();
    await expect(page).toHaveURL(new RegExp(`/es/orders/${number}`));
    expect((await prisma.payment.findUniqueOrThrow({ where: { orderId: order.id } })).status).toBe("FAILED");
    expect((await prisma.inventoryStock.findUniqueOrThrow({ where: { id: stock.id } })).quantityReserved).toBe(0);
  } finally {
    await prisma.paymentEvent.deleteMany({ where: { payment: { orderId: order.id } } });
    await prisma.payment.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.inventoryStock.delete({ where: { id: stock.id } });
    await prisma.product.delete({ where: { id: product.id } });
  }
});
