import { expect, test } from "@playwright/test";

test("legacy unprefixed URLs redirect permanently to Spanish", async ({ request }) => {
  for (const path of ["/catalog", "/ayuda", "/cart", "/vehiculos/toyota"]) {
    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.status(), `${path} should be a permanent redirect`).toBe(308);
    expect(response.headers().location).toBe(`/es${path}`);
  }
});

test("the legacy redirect keeps the query string", async ({ request }) => {
  const response = await request.get("/catalog?q=toyota&brand=Bosch", { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/es/catalog?q=toyota&brand=Bosch");
});

test("the root negotiates the language instead of redirecting permanently", async ({ request }) => {
  // Un permanente aca se cachearia por URL sin mirar headers y dejaria clavado
  // en un idioma a todos los visitantes siguientes.
  const english = await request.get("/", {
    headers: { "Accept-Language": "en-US,en;q=0.9" },
    maxRedirects: 0,
  });
  expect(english.status()).toBe(307);
  expect(english.headers().location).toBe("/en");

  const spanish = await request.get("/", {
    headers: { "Accept-Language": "es-SV,es;q=0.9" },
    maxRedirects: 0,
  });
  expect(spanish.status()).toBe(307);
  expect(spanish.headers().location).toBe("/es");

  // Un idioma que no servimos cae al principal.
  const french = await request.get("/", {
    headers: { "Accept-Language": "fr-FR,fr;q=0.9" },
    maxRedirects: 0,
  });
  expect(french.headers().location).toBe("/es");
});

test("the negotiated root declares what it varies on", async ({ request }) => {
  const response = await request.get("/", {
    headers: { "Accept-Language": "en-US" },
    maxRedirects: 0,
  });

  const vary = response.headers().vary ?? "";
  expect(vary.toLowerCase()).toContain("accept-language");
  expect(vary.toLowerCase()).toContain("cookie");
});

test("the locale cookie wins over the Accept-Language header", async ({ baseURL, context }) => {
  await context.addCookies([{ name: "castillo_locale", value: "en", url: baseURL! }]);

  // `context.request` comparte el almacen de cookies del navegador; el fixture
  // `request` suelto no, y mandaria la peticion sin cookie.
  const response = await context.request.get("/", {
    headers: { "Accept-Language": "es-SV,es;q=0.9" },
    maxRedirects: 0,
  });

  expect(response.headers().location).toBe("/en");
});

test("both languages render the storefront", async ({ page }) => {
  await page.goto("/es/catalog");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { name: "Catálogo de repuestos" })).toBeVisible();

  await page.goto("/en/catalog");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the admin panel stays outside the locale prefix", async ({ request }) => {
  const unprefixed = await request.get("/admin/login", { maxRedirects: 0 });
  expect(unprefixed.status()).toBe(200);
  expect(unprefixed.headers().location ?? "").not.toContain("/es/admin");

  // La variante prefijada no debe existir: el admin vive fuera del ruteo de
  // idiomas, asi que `/es/admin/...` no es una ruta valida.
  const prefixed = await request.get("/es/admin/login", { maxRedirects: 0 });
  expect(prefixed.status()).toBe(404);
});

test("alternate links point search engines at the other language", async ({ request }) => {
  const response = await request.get("/es/catalog");
  const link = response.headers().link ?? "";

  expect(link).toContain('hreflang="es"');
  expect(link).toContain('hreflang="en"');
});

/**
 * Canario de la composición del middleware.
 *
 * next-intl construye su propia respuesta y no deja inyectarle los headers de
 * request, así que el middleware la re-emite leyendo `x-middleware-rewrite`,
 * que es contrato interno de Next y no API pública. Si Next lo cambia, los
 * `<script>` de bootstrap pierden el nonce y la CSP deja de proteger en
 * silencio. Este test lo detecta en voz alta.
 */
test("Next scripts carry the nonce the middleware issued", async ({ request }) => {
  const response = await request.get("/es/catalog");
  const nonce = response.headers()["x-nonce"];

  expect(nonce, "the middleware must issue a nonce").toBeTruthy();

  const html = await response.text();
  const scriptsWithNonce = html.match(new RegExp(`nonce="${nonce}"`, "g")) ?? [];
  const scriptsWithoutNonce = (html.match(/<script(?![^>]*\bnonce=)[^>]*\bsrc=/g) ?? []).length;

  expect(scriptsWithNonce.length).toBeGreaterThan(0);
  expect(scriptsWithoutNonce, "every script Next emits must be nonced").toBe(0);
});
