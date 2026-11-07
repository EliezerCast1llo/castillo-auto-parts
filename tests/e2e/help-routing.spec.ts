import { expect, test, type APIRequestContext } from "@playwright/test";

const helpPages = [
  { locale: "es", path: "/es/ayuda", alias: "/es/help", heading: "el repuesto correcto", faq: "Preguntas frecuentes" },
  { locale: "en", path: "/en/help", alias: "/en/ayuda", heading: "the right part", faq: "Frequently asked questions" },
] as const;

// Seguir los saltos explícitamente detecta tanto un ciclo entre dos URLs como
// una redirección a sí misma; un GET con seguimiento automático oculta la cadena.
async function followHelp(request: APIRequestContext, baseURL: string, path: string) {
  let url = new URL(path, baseURL);
  const visited = new Set<string>();
  for (let hops = 0; hops <= 2; hops++) {
    expect(visited.has(url.href), `Redirect cycle: ${[...visited, url.href].join(" → ")}`).toBe(false);
    visited.add(url.href);
    const response = await request.get(url.href, { maxRedirects: 0 });
    if (response.status() === 200) return { response, url, hops };
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBeTruthy();
    const destination = new URL(response.headers().location, url);
    expect(destination.origin).toBe(url.origin);
    url = destination;
  }
  throw new Error(`Too many Help redirects: ${[...visited].join(" → ")}`);
}

for (const help of helpPages) {
  test(`${help.locale}: canonical Help renders directly and its alias redirects once`, async ({ request, baseURL }) => {
    for (const [path, hops] of [[help.path, 0], [help.alias, 1]] as const) {
      const result = await followHelp(request, baseURL!, `${path}?from=help-regression`);
      expect(result.hops).toBe(hops);
      expect(result.url.pathname).toBe(help.path);
      expect(result.url.search).toBe("?from=help-regression");
      const html = await result.response.text();
      expect(html).toContain(`<html lang="${help.locale}"`);
      expect(html).toContain(help.faq);
      expect(html).toContain('rel="canonical"');
    }
  });

  test(`${help.locale}: Help metadata and language switch preserve the public routes`, async ({ page }) => {
    await page.goto(help.path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(help.heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${help.path}$`));
    for (const alternate of helpPages) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${alternate.locale}"]`)).toHaveAttribute("href", new RegExp(`${alternate.path}$`));
    }
    const other = helpPages.find((item) => item.locale !== help.locale)!;
    const languageLink = page.locator(`a[hreflang="${other.locale}"]`).filter({ visible: true }).first();
    await expect(languageLink).toHaveAttribute("href", other.path);
    await languageLink.click();
    await expect(page).toHaveURL(new RegExp(`${other.path}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", other.locale);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(other.heading);
    await expect(page.getByText(other.faq, { exact: true })).toBeVisible();
  });

  for (const source of ["", "/catalog", "/product/pastillas-delanteras-nissan-sentra"]) {
    test(`${help.locale}: footer Help link works from ${source || "home"}`, async ({ page }) => {
      await page.goto(`/${help.locale}${source}`);
      const link = page.locator(`footer a[href="${help.path}"]`);
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${help.path}$`));
      await expect(page.getByRole("heading", { level: 1 })).toContainText(help.heading);
      await expect(page.getByText(help.faq, { exact: true })).toBeVisible();
    });
  }
}

test("the sitemap advertises only the public Help URLs", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  for (const help of helpPages) {
    expect(xml).toMatch(new RegExp(`<loc>[^<]+${help.path}</loc>`));
    expect(xml).not.toContain(help.alias);
  }
});
