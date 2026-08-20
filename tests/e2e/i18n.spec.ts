import { expect, test } from "@playwright/test";
import { EN, ES } from "./helpers";

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

test("each language serves its own spelling of the localized routes", async ({ page }) => {
  await page.goto("/es/ayuda");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");

  await page.goto("/en/help");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.goto("/es/vehiculos/toyota");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");

  await page.goto("/en/vehicles/toyota");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the spelling of the other language redirects instead of 404ing", async ({ request }) => {
  // `/es/help` no es una URL valida en espanol, pero en vez de romper next-intl
  // reconoce la ruta interna y manda a la grafia correcta.
  const spanishWithEnglishSpelling = await request.get("/es/help", { maxRedirects: 0 });
  expect(spanishWithEnglishSpelling.status()).toBe(307);
  expect(spanishWithEnglishSpelling.headers().location).toContain("/es/ayuda");

  const englishWithSpanishSpelling = await request.get("/en/ayuda", { maxRedirects: 0 });
  expect(englishWithSpanishSpelling.status()).toBe(307);
  expect(englishWithSpanishSpelling.headers().location).toContain("/en/help");

  const dynamicRoute = await request.get("/es/vehicles/toyota", { maxRedirects: 0 });
  expect(dynamicRoute.headers().location).toContain("/es/vehiculos/toyota");
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

test("the matcher excludes whole segments, not prefixes", async ({ request }) => {
  // Sin frontera de segmento, `api` excluiria tambien `/apiario` y esa ruta se
  // saltaria el middleware entero: sin CSP y sin ruteo de idioma.
  for (const path of ["/apiario", "/iconos", "/opengraph-images"]) {
    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.status(), `${path} debe pasar por el middleware`).toBe(308);
    expect(response.headers().location).toBe(`/es${path}`);
  }

  // Y los que si son endpoints o assets se siguen saltando.
  const api = await request.get("/api/search?q=toyota", { maxRedirects: 0 });
  expect(api.status()).not.toBe(308);
});

test("a signed-out visitor browsing in English stays in English", async ({ page }) => {
  // El redirect legacy oculta esta clase de bug: nada da 404, solo se pierde el
  // idioma. Por eso el guard se prueba navegando en ingles.
  await page.goto(EN("/account"));

  await expect(page).toHaveURL(/\/en\/auth\/login/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.goto(EN("/account/orders"));
  await expect(page).toHaveURL(/\/en\/auth\/login/);

  await page.goto(EN("/account/addresses"));
  await expect(page).toHaveURL(/\/en\/auth\/login/);
});

test("the canonical of each language points at its own URL", async ({ page }) => {
  for (const [locale, path] of [
    ["es", "/es/catalog"],
    ["en", "/en/catalog"],
  ] as const) {
    await page.goto(path);

    // Un canonical sin prefijo haria que ambos idiomas declararan la misma URL,
    // y Google leeria el ingles como duplicado de una que ni responde 200.
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical, `canonical de ${locale}`).toContain(`/${locale}/catalog`);

    // Next mergea metadata superficialmente: declarar `alternates` en la pagina
    // borra los `languages` del layout si no se re-declaran.
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
  }
});

test("a language without its own copy is served but not offered to crawlers", async ({
  page,
  request,
}) => {
  // Mientras el copy en ingles no exista, /en/* renderiza texto en espanol bajo
  // lang="en": indexarlo seria publicar contenido duplicado en el idioma
  // equivocado. Sigue navegable y sigue emitiendo hreflang.
  await page.goto("/en/catalog");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );

  await page.goto("/es/catalog");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  expect(urls.length).toBeGreaterThan(0);
  expect(urls.filter((url) => new URL(url).pathname.startsWith("/en"))).toEqual([]);
  // Los alternates si listan el otro idioma: le dicen al buscador que existe.
  expect(sitemap).toContain('hreflang="en"');
});

test("the chrome and the status messages speak the language of the page", async ({ page }) => {
  // Por testid y no por el aria-label: ese label ahora se traduce, asi que
  // buscarlo por texto ataria el test al idioma que justamente esta probando.
  const nav = () => page.getByTestId("site-nav").getByRole("link");

  await page.goto("/es/catalog");
  await expect(nav().first()).toHaveText("Catálogo");

  await page.goto("/en/catalog");
  await expect(nav().first()).toHaveText("Catalog");

  // El mismo codigo significa cosas distintas segun el area, asi que se
  // verifican las dos: `invalid` es credenciales en el login y formulario en el
  // checkout.
  await page.goto("/en/auth/login?estado=invalid");
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();

  await page.goto("/es/auth/login?estado=invalid");
  await expect(page.getByText("Email o contraseña incorrectos.")).toBeVisible();

  await page.goto("/en/checkout?estado=invalid");
  await expect(page.getByText("Please review the form details.")).toBeVisible();
});

test("a failed action redirects back into the language the visitor was browsing", async ({
  page,
}) => {
  // El circuito completo, no solo el renderizado: la accion arma el redirect y
  // la pagina de destino traduce el mensaje. Si la accion deduce mal el idioma,
  // el mensaje sale correcto pero en el idioma equivocado, porque el usuario ya
  // aterrizo en la URL equivocada.
  // Se localiza por el `name` de los campos y no por su label: el formulario
  // todavia no esta traducido, asi que buscarlo por su texto en espanol ataria
  // la prueba al idioma que justamente esta probando —y la romperia el dia que
  // la tajada de auth lo traduzca.
  await page.goto(EN("/auth/login"));
  await page.locator('input[name="email"]').fill("no-existe@e2e.castilloautoparts.com");
  await page.locator('input[name="password"]').fill("credenciales-invalidas");
  await page.locator('form:has(input[name="password"]) button[type="submit"]').first().click();

  await expect(page).toHaveURL(/\/en\/auth\/login\?.*estado=invalid/);
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();

  // El idioma sale del `Referer` del POST, que apunta a la pagina del
  // formulario. Se verifica el resultado y no el mecanismo, pero vale dejar
  // dicho cual es: la cookie de idioma NO esta garantizada en este punto.
});

test("the same failed action keeps a Spanish visitor in Spanish", async ({ page }) => {
  await page.goto(ES("/auth/login"));
  await page.locator('input[name="email"]').fill("no-existe@e2e.castilloautoparts.com");
  await page.locator('input[name="password"]').fill("credenciales-invalidas");
  await page.locator('form:has(input[name="password"]) button[type="submit"]').first().click();

  await expect(page).toHaveURL(/\/es\/auth\/login\?.*estado=invalid/);
  await expect(page.getByText("Email o contraseña incorrectos.")).toBeVisible();
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
