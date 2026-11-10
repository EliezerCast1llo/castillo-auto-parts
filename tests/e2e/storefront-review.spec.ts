import { expect, test, type Page } from "@playwright/test";
import es from "../../src/lib/i18n/messages/es";
import en from "../../src/lib/i18n/messages/en";
import { PRODUCT_CLAIMS } from "./fixtures/products";

const product = PRODUCT_CLAIMS["storefront-review.spec.ts"].copyAndMetadata;
const brand = "Castillo Auto Parts";

async function expectTitle(page: Page, description?: string) {
  await expect(page).toHaveTitle(description ? `${description} | ${brand}` : /^.+ \| Castillo Auto Parts$/);
  const title = await page.title();
  expect(title.split(brand)).toHaveLength(2);
}

async function primaryNav(page: Page, mobile: boolean, openLabel: string) {
  if (!mobile) return page.getByTestId("site-nav");
  await page.getByRole("button", { name: openLabel }).click();
  return page.getByRole("dialog").getByRole("navigation");
}

for (const { locale, messages } of [{ locale: "es", messages: es }, { locale: "en", messages: en }]) {
  const helpPath = locale === "es" ? "/es/ayuda" : "/en/help";

  for (const width of [390, 1024, 1440]) {
    test(`${locale}: navigation at ${width}px uses unfiltered brands and last units`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}`);
      const nav = await primaryNav(page, width < 1024, messages.Nav.openMenu);
      await expect(nav.getByRole("link", { name: messages.Nav.brands, exact: true })).toHaveAttribute("href", `/${locale}/catalog`);
      const lastUnits = nav.getByRole("link", { name: messages.Nav.lastUnits, exact: true });
      await expect(lastUnits).toHaveAttribute("href", `/${locale}/catalog?stock=LOW_STOCK`);
      await expect(nav.getByRole("link", { name: /^(Ofertas|Deals)$/ })).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath("home-navigation.png") });
      await lastUnits.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/catalog\\?stock=LOW_STOCK$`));
      const cards = page.locator("article");
      await expect(cards.first()).toBeVisible();
      for (const card of await cards.all()) await expect(card).toContainText(messages.Catalog.stockStatus.LOW_STOCK);

      const catalogNav = await primaryNav(page, width < 1024, messages.Nav.openMenu);
      await catalogNav.getByRole("link", { name: messages.Nav.brands, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/catalog$`));
      await expect(page.locator('input[name="brand"]:checked')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath("catalog-navigation.png") });
    });
  }

  test(`${locale}: the existing brand filter still selects Bosch intentionally`, async ({ page }) => {
    await page.goto(`/${locale}/catalog`);
    const checkbox = page.locator('input[name="brand"][value="Bosch"]:visible');
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(page).toHaveURL(/brand=Bosch/);
    await expect(page.getByRole("link", { name: /(?:Quitar filtro|Remove filter).*Bosch/ })).toBeVisible();
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();
    for (const card of await cards.all()) await expect(card).toContainText("Bosch");
  });

  test(`${locale}: last units has an honest filtered empty state`, async ({ page }) => {
    await page.goto(`/${locale}/catalog?stock=LOW_STOCK&q=no-match-issue-131`);
    await expect(page.getByText(messages.Catalog.empty.noMatchesTitle, { exact: true })).toBeVisible();
    const chip = `${messages.Catalog.availabilityLegend}: ${messages.Catalog.stockStatus.LOW_STOCK}`;
    await expect(page.getByRole("link", { name: messages.Catalog.removeFilter.replace("{filter}", chip), exact: true })).toBeVisible();
    await expect(page.getByTestId("site-nav").getByRole("link", { name: /^(Ofertas|Deals)$/ })).toHaveCount(0);
  });

  test(`${locale}: delivery copy is visible before payment and public/auth titles have one brand suffix`, async ({ page }) => {
    for (const [path, title] of [
      [`/${locale}`, messages.Common.homeMetadataTitle],
      [`/${locale}/catalog`, messages.Catalog.metaTitle],
      [helpPath, messages.Help.metadataTitle],
      [`/${locale}/auth/login`, messages.Auth.login.metadataTitle],
      [`/${locale}/auth/register`, messages.Auth.register.metadataTitle],
      [`/${locale}/auth/forgot-password`, messages.Auth.forgotPassword.metadataTitle],
    ]) {
      await page.goto(path);
      await expectTitle(page, title);
    }
    await page.goto(helpPath);
    await expect(page.getByText(messages.Help.delivery.local, { exact: true }).first()).toBeVisible();
    await page.goto(`/${locale}/product/${product.slug}`);
    await expectTitle(page, (await page.getByRole("heading", { level: 1 }).textContent())!.trim());
    await expect(page.getByText(messages.Product.deliveryNotice, { exact: true })).toBeVisible();
    expect(messages.Product.deliveryNotice).toContain(locale === "es" ? "antes de confirmar el pago" : "before confirming payment");
    expect(messages.Product.deliveryNotice).toContain("Boxful");
    expect(messages.Product.deliveryNotice).toContain("($0)");
    expect(messages.Product.deliveryNotice).toContain(locale === "es" ? "solo con una promoción aplicable" : "only with an applicable promotion");
    await page.getByRole("button", { name: messages.Cart.addToCart.label, exact: true }).click();
    await expect(page.getByText(messages.Cart.addToCart.added, { exact: true })).toBeVisible();
    await page.goto(`/${locale}/cart`);
    await expectTitle(page, messages.Cart.metadata.title);
    await expect(page.getByText(messages.Cart.summary.deliveryNotice, { exact: true })).toBeVisible();
    await page.goto(`/${locale}/checkout`, { waitUntil: "domcontentloaded" });
    await expectTitle(page, messages.Checkout.metadata.title);
    await expect(page.getByText(messages.Checkout.summary.nationalShipping, { exact: true })).toBeVisible();
    await expect(page.getByText(messages.Checkout.delivery.pickupCost.replace("{amount}", "$0.00"), { exact: false })).toBeVisible();
    // Solo revisión de presentación: no cotizar ni crear pedidos/pagos (#96).
  });

  test(`${locale}: account titles also use the shared suffix once`, async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${locale === "es" ? 131 : 132}` });
    await page.goto(`/${locale}/auth/register`);
    await page.getByLabel(messages.Auth.register.fullName, { exact: true }).fill("Cliente Revision SEO");
    await page.getByLabel(messages.Auth.register.email, { exact: true }).fill(`review-${locale}-${Date.now()}@e2e.castilloautoparts.com`);
    await page.getByLabel(messages.Auth.register.password, { exact: true }).fill("TestPassword131!");
    await page.getByLabel(messages.Auth.register.confirmPassword, { exact: true }).fill("TestPassword131!");
    await page.getByRole("button", { name: messages.Auth.register.submit, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/account$`));
    for (const [path, title] of [
      ["/account", messages.Account.metadataTitle],
      ["/account/orders", messages.Orders.list.metadataTitle],
      ["/account/addresses", messages.Account.addresses.metadataTitle],
    ]) {
      await page.goto(`/${locale}${path}`);
      await expectTitle(page, title);
    }
  });
}
