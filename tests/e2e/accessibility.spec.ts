import { expect, test } from "@playwright/test";

for (const locale of ["es", "en"] as const) {
  test(`product buttons preserve the visible ${locale} label in their accessible name`, async ({ page }) => {
    await page.goto(`/${locale}/catalog`);
    const buttons = page.locator('form:has(input[name="sku"]) button[aria-label]:enabled');
    await expect(buttons.first()).toBeVisible();
    const names = await buttons.evaluateAll((elements) =>
      elements.map((element) => ({
        visible: element.textContent?.trim(),
        accessible: element.getAttribute("aria-label"),
      })),
    );
    for (const name of names) {
      expect(name.visible).toBeTruthy();
      expect(name.accessible).toMatch(new RegExp(`^${name.visible}: .+`));
      expect(name.visible).not.toContain("undefined");
    }
    expect(names[0].visible).toBe(locale === "es" ? "Agregar al carrito" : "Add to cart");
  });
}

test("the storefront icon is served and support links retain their visible accessible text", async ({ page, request }) => {
  const response = await request.get("/icon.svg");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("image/svg+xml");

  await page.goto("/es");
  const support = page.locator('a:has(svg.lucide-message-circle)');
  expect(await support.count()).toBeGreaterThan(0);
  for (const link of await support.all()) {
    const text = (await link.innerText()).trim();
    expect(text).toBeTruthy();
    await expect(link).toHaveAccessibleName(text);
  }
});
