import { expect, test } from "@playwright/test";

const viewports = [
  { height: 844, name: "mobile", width: 390 },
  { height: 1024, name: "tablet", width: 768 },
];

const customerPages = [
  {
    heading: "Compra repuestos con compatibilidad clara antes de pagar",
    path: "/",
  },
  {
    heading: "Catálogo de repuestos",
    path: "/catalog",
  },
  {
    heading: "Filtro de aceite para Toyota 1.8L",
    path: "/product/filtro-aceite-toyota-18l",
  },
  {
    heading: "Tu carrito",
    path: "/cart",
  },
];

for (const viewport of viewports) {
  test.describe(`responsive customer pages on ${viewport.name}`, () => {
    test.use({ viewport });

    for (const customerPage of customerPages) {
      test(`${customerPage.path} fits without horizontal overflow`, async ({ page }) => {
        await page.goto(customerPage.path);

        await expect(
          page.getByRole("heading", { exact: true, name: customerPage.heading }),
        ).toBeVisible();

        const viewportFit = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));

        expect(viewportFit.scrollWidth).toBeLessThanOrEqual(viewportFit.clientWidth + 1);
      });
    }
  });
}
