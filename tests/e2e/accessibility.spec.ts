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
      expectProductLabel(name);
      expect(name.visible).not.toContain("undefined");
    }
    expect(names[0].visible).toBe(locale === "es" ? "Agregar al carrito" : "Add to cart");
  });
}

test("product accessible labels treat regex characters as literal text", () => {
  for (const visible of ["Add (+) [1]?", "Buy for $5.00*", "Part \\ kit ^ special | end"]) {
    expectProductLabel({ visible, accessible: `${visible}: Toyota Corolla` });
  }
});

function expectProductLabel({ visible, accessible }: { visible: string | null | undefined; accessible: string | null }) {
  expect(visible).toBeTruthy();
  const prefix = `${visible}: `;
  expect(accessible?.startsWith(prefix)).toBe(true);
  expect(accessible?.slice(prefix.length).trim()).toBeTruthy();
}

test("CSP upgrades insecure requests only in the enforced response header", async ({ request }) => {
  const response = await request.get("/en/catalog");
  const enforced = process.env.CSP_ENFORCE === "true";
  const header = enforced ? "content-security-policy" : "content-security-policy-report-only";
  const otherHeader = enforced ? "content-security-policy-report-only" : "content-security-policy";
  const policy = response.headers()[header];
  expect(policy).toBeTruthy();
  expect(policy.split("; ").includes("upgrade-insecure-requests")).toBe(enforced);
  expect(response.headers()[otherHeader]).toBeUndefined();
});

for (const locale of ["es", "en"] as const) {
  test(`WhatsApp support and empty-search fallback use ${locale} text`, async ({ page }) => {
    const phone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
    const hasPhone = phone.length >= 8;
    await page.goto(`/${locale}/catalog?q=no-match-issue-99`);
    const label = hasPhone
      ? (locale === "en" ? "Ask us on WhatsApp" : "Consultar por WhatsApp")
      : (locale === "en" ? "We can help you find it" : "Te ayudamos a encontrarlo");
    const link = page.getByRole("link", { name: label, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAccessibleName(label);
    if (hasPhone) {
      const url = new URL((await link.getAttribute("href"))!);
      expect(url.origin).toBe("https://wa.me");
      expect(url.pathname).toBe(`/${phone}`);
      expect(url.searchParams.get("text")).toBe(locale === "en"
        ? "Hi, I need help finding a part that fits my vehicle."
        : "Hola, necesito ayuda para encontrar un repuesto compatible con mi vehículo.");
    } else {
      await expect(link).toHaveAttribute("href", locale === "en" ? "/en/help" : "/es/ayuda");
      await link.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/${locale === "en" ? "help" : "ayuda"}$`));
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    }
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
