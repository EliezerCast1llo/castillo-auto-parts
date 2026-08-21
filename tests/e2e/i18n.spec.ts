import { expect, test, type Page } from "@playwright/test";
import { EN, ES } from "./helpers";
import { PRODUCT_CLAIMS } from "./fixtures/products";
import { prisma } from "./helpers";

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

test("product content follows the language, and falls back field by field", async ({
  page,
  request,
}) => {
  // Producto con traduccion: nombre y descripcion en ingles.
  await page.goto(ES("/product/filtro-aceite-toyota-18l"));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Filtro de aceite");

  await page.goto(EN("/product/filtro-aceite-toyota-18l"));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("oil filter");

  // La busqueda encuentra por el nombre traducido: sin la clausula sobre la
  // tabla de traducciones, quien busca en ingles no encuentra nada.
  const english = await (await request.get("/api/search?q=oil%20filter&locale=en")).json();
  expect(english.results.length).toBeGreaterThan(0);
  expect(english.results[0].name).toContain("oil filter");

  // Y el idioma viaja en la query, no en la cookie: la respuesta se cachea en
  // el CDN y la clave tiene que separarlos.
  const spanish = await (await request.get("/api/search?q=filtro&locale=es")).json();
  expect(spanish.results.length).toBeGreaterThan(0);
  expect(spanish.results[0].name).toContain("Filtro");
});

test("a product without translation still renders inside the English site", async ({ page }) => {
  // El fallback es por campo y por producto: el catalogo en ingles muestra en
  // espanol lo que todavia no tiene traduccion, en vez de quedar en blanco.
  // Sin esto, publicar el ingles obligaria a traducir el catalogo entero antes.
  await page.goto(EN("/catalog"));

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: /^Amortiguador delantero/ }).first()).toBeVisible();
});

test("category facets are translated and still filter", async ({ page }) => {
  // Las dos mitades del mismo hallazgo: la faceta tiene que decirse en ingles
  // y, al usarla, tiene que seguir encontrando productos. Antes se filtraba
  // por nombre de categoria, asi que traducir la etiqueta habria dejado el
  // filtro sin resultados; ahora el identificador es el slug y la etiqueta va
  // aparte.
  //
  // El `:visible` no es adorno: el sidebar esta dos veces en el DOM (el drawer
  // movil primero, oculto), y sin filtrar se engancha la copia escondida.
  await page.goto(EN("/catalog"));

  const brakes = page.locator("label:visible", { hasText: /^Brakes/ });
  await expect(brakes).toHaveCount(1);

  // La etiqueta se lee traducida, y el valor que viaja en el form sigue siendo
  // el identificador.
  await expect(brakes.locator("input[name='category']")).toHaveValue("frenos");
  await expect(page.locator("label:visible", { hasText: /^Frenos/ })).toHaveCount(0);

  // Y filtrando por ese identificador hay resultados: es la mitad que se
  // habria roto si la faceta hubiera empezado a mandar "Brakes".
  await page.goto(EN("/catalog?category=frenos"));
  // El contador sigue en espanol: ese copy es de fase 6. Lo que se verifica
  // aca es que haya resultados, no en que idioma se cuentan.
  await expect(page.getByText(/^[1-9][\d.,]* (productos?|products?)$/)).toBeVisible();
  await expect(page.getByText("Categoría: Brakes")).toBeVisible();
});

test("the product breadcrumb links to the category by identifier", async ({ page }) => {
  // Quinta vez que aparece el mismo colapso: el breadcrumb —el visible y el
  // del JSON-LD— armaba `?category=` con el nombre de la categoria. En ingles
  // eso apuntaba a `?category=Brakes`, que no encuentra nada.
  await page.goto(EN("/product/pastillas-delanteras-nissan-sentra"));

  const link = page.getByRole("link", { name: "Brakes", exact: true }).first();
  await expect(link).toHaveAttribute("href", /category=frenos/);

  // Y el JSON-LD emite el mismo identificador, no la grafia traducida.
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  const breadcrumb = jsonLd.find((raw) => raw.includes("BreadcrumbList"))!;
  expect(breadcrumb).toContain("category=frenos");
  expect(breadcrumb).not.toContain("category=Brakes");

  await link.click();
  await expect(page.getByText(/^[1-9][\d.,]* (productos?|products?)$/)).toBeVisible();
});

test("old category URLs redirect to the canonical slug", async ({ page }) => {
  // `/catalog?category=Frenos` viajo en la navegacion del sitio y quedo en
  // historiales y en el indice: tiene que seguir encontrando la categoria, y
  // curarse sola hacia el identificador canonico.
  await page.goto(ES("/catalog?category=Frenos"));

  // Al slug canonico, y sin salir del idioma: `permanentRedirect` es el de
  // `next/navigation` y no localiza nada, asi que un "/catalog" pelado como
  // destino sacaba de /en a quien navegaba en ingles.
  await expect(page).toHaveURL(/\/es\/catalog\?category=frenos$/);
  await expect(page.getByText(/^[1-9][\d.,]* productos?$/)).toBeVisible();

  // En ingles el mismo nombre viejo tiene que curarse dentro de /en.
  await page.goto(EN("/catalog?category=Frenos"));
  await expect(page).toHaveURL(/\/en\/catalog\?category=frenos$/);
});

test("the English short description reaches the page", async ({ page }) => {
  // La descripcion corta no tiene campo propio en la ficha: aparece como
  // compatibilidad cuando el producto no tiene vehiculos cargados. Sin
  // traducirla, el admin podia cargarla, guardarla, y no verla nunca.
  await page.goto(ES("/product/escobilla-universal-22-pulgadas"));
  await expect(page.getByText("Universal por medida").first()).toBeVisible();

  await page.goto(EN("/product/escobilla-universal-22-pulgadas"));
  await expect(page.getByText("Universal by size").first()).toBeVisible();
});

test("the catalog copy and its plurals follow the language", async ({ page }) => {
  await page.goto(ES("/catalog"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Catálogo de repuestos");
  await expect(page.getByRole("navigation", { name: "Ruta del catálogo" })).toBeVisible();

  await page.goto(EN("/catalog"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Parts catalog");
  await expect(page.getByRole("navigation", { name: "Catalog breadcrumb" })).toBeVisible();

  // Para probar el plural hay que forzar la forma singular: `products?` habria
  // pasado igual con la concatenacion vieja. Se filtra por un SKU exacto, que
  // devuelve un solo producto.
  await page.goto(EN("/catalog?q=MOCK-FIL-TOY-18"));
  await expect(page.getByText("1 product", { exact: true })).toBeVisible();

  await page.goto(ES("/catalog?q=MOCK-FIL-TOY-18"));
  await expect(page.getByText("1 producto", { exact: true })).toBeVisible();
});

test("every empty-state shortcut leads to results, in both languages", async ({ page }) => {
  // El label se traduce, la query no: es lo que se compara contra el contenido.
  // Se recorren TODOS los atajos y no uno: cuando este test miraba solo el
  // primero, tres de los cuatro devolvian cero resultados sin que nada avisara.
  for (const locale of ["es", "en"] as const) {
    await page.goto(`/${locale}/catalog?q=zzzz-sin-resultados`);

    const shortcuts = page.getByTestId("empty-state-suggestion");
    const count = await shortcuts.count();
    expect(count).toBeGreaterThan(0);

    const targets: string[] = [];
    for (let index = 0; index < count; index += 1) {
      targets.push((await shortcuts.nth(index).getAttribute("href"))!);
    }

    for (const target of targets) {
      await page.goto(target);
      await expect(
        page.getByText(/^[1-9][\d.,]* (productos?|products?)$/),
        `${target} deberia devolver resultados`,
      ).toBeVisible();
    }
  }
});

test("a multi-word search finds products", async ({ page }) => {
  // El espacio viaja como `+` en la query que serializa next-intl. Se prueban
  // las dos codificaciones porque una falla silenciosa aca dejaria sin
  // resultados a cualquiera que escriba mas de una palabra, que es lo normal.
  for (const query of ["filtro+de+aceite", "filtro%20de%20aceite", "disco%20de%20freno"]) {
    await page.goto(`/es/catalog?q=${query}`);
    // El contador acepta los dos idiomas y separador de miles: lo que se
    // verifica es que haya resultados, no como se escribe el numero.
    await expect(
      page.getByText(/^[1-9][\d.,]* (productos?|products?)$/),
      `${query} deberia devolver resultados`,
    ).toBeVisible();
  }
});

/**
 * Producto de trabajo de estos tres tests.
 *
 * No es `filtro-aceite-toyota-18l` a proposito: `catalog-cart.spec.ts` lo deja
 * sin stock a mitad de su corrida, y los specs comparten base aunque tengan
 * contextos de navegador separados. Con ese producto estos tests pasaban
 * aislados y fallaban en la suite completa, que es la peor forma de fallar.
 */
const CART_PRODUCT = PRODUCT_CLAIMS["i18n.spec.ts"].cartAndCheckout.slug;

test("the cart speaks the language of the page, plurals included", async ({ page }) => {
  // El plural va por ICU y no por concatenacion: con `productos?` en el regex
  // este test habria pasado igual con la version vieja. Se compara el texto
  // exacto en singular, que es la forma que la concatenacion no sabia producir.
  await page.goto(ES(`/product/${CART_PRODUCT}`));
  await page.getByRole("button", { exact: true, name: "Agregar al carrito" }).click();
  await expect(page.getByText("Repuesto agregado al carrito")).toBeVisible();

  await page.goto(ES("/cart"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tu carrito");
  await expect(page.getByText("1 producto", { exact: true })).toBeVisible();
  await expect(page.getByText("1 unidad", { exact: true })).toBeVisible();

  await page.goto(EN("/cart"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your cart");
  await expect(page.getByText("1 product", { exact: true })).toBeVisible();
  await expect(page.getByText("1 unit", { exact: true })).toBeVisible();
  // Y el carrito es el mismo: el idioma cambia el texto, no el estado.
  await expect(page.getByText("Continue to payment")).toBeVisible();
});

test("the checkout form speaks the language of the page", async ({ page }) => {
  await page.goto(ES(`/product/${CART_PRODUCT}`));
  await page.getByRole("button", { exact: true, name: "Agregar al carrito" }).click();
  await expect(page.getByText("Repuesto agregado al carrito")).toBeVisible();

  await page.goto(ES("/checkout"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Datos de entrega y pago");
  await expect(page.getByLabel("Nombre completo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar y pagar" })).toBeVisible();

  await page.goto(EN("/checkout"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Delivery and payment details");
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm and pay" })).toBeVisible();

  // Los campos de entrega son un componente de cliente: si sus mensajes no
  // viajaran al navegador, esto saldria como MISSING_MESSAGE en vez de texto.
  await expect(page.getByText("Local delivery")).toBeVisible();
  await expect(page.getByText("Pickup at the warehouse").first()).toBeVisible();
});

test("an empty cart says so in both languages", async ({ page, context }) => {
  await context.clearCookies();

  await page.goto(ES("/cart"));
  await expect(page.getByText("Tu carrito está vacío")).toBeVisible();

  await page.goto(EN("/cart"));
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});

/** Correos creados por este spec, para poder borrarlos al terminar. */
const createdEmails: string[] = [];

/**
 * `npm run test:e2e` siembra un esquema aislado por corrida y lo tira al
 * final, asi que ahi esto sobra. `test:e2e:raw` corre playwright pelado contra
 * la base de desarrollo, y sin esto cada corrida deja usuarios y pedidos
 * acumulados.
 */
test.afterAll(async () => {
  if (createdEmails.length === 0) return;

  const users = await prisma.user.findMany({
    select: { id: true },
    where: { email: { in: createdEmails } },
  });
  const userIds = users.map((user) => user.id);

  // El orden importa: las lineas y el envio cuelgan de la orden, y la orden
  // del usuario.
  const orders = await prisma.order.findMany({
    select: { id: true },
    where: { userId: { in: userIds } },
  });
  const orderIds = orders.map((order) => order.id);

  await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.shipment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
});

/**
 * Registrarse deja la sesion abierta, que es todo lo que estos dos tests
 * necesitan. Cada uno usa su propio correo para no pisarse entre workers.
 */
async function signInCustomer(page: Page, prefix: string) {
  const email = `${prefix}-${Date.now()}@e2e.castilloautoparts.com`;

  await page.goto(ES("/auth/register"));
  await page.getByLabel("Nombre completo").fill("Cliente i18n E2E");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").first().fill("TestPassword123!");
  await page.getByLabel("Confirmar contraseña").fill("TestPassword123!");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/account/);

  createdEmails.push(email);

  return email;
}

/**
 * Deja un pedido enviado para ese cliente, escrito directo a la base.
 *
 * No pasa por el checkout a propósito: lo que se quiere probar es el
 * seguimiento, y hacerlo comprando ataría este test al flujo de compra y
 * consumiría inventario que otros specs miden. El producto es el que este spec
 * ya tiene reservado en `fixtures/products.ts`.
 *
 * `SHIPPED` + `LOCAL_DELIVERY` es el estado que produce la etiqueta más
 * específica del seguimiento —"En camino" / "On the way"—, que es justo la que
 * distingue haber traducido de haber dejado el identificador crudo.
 */
async function createShippedOrder(email: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const product = await prisma.product.findUniqueOrThrow({
    where: { sku: PRODUCT_CLAIMS["i18n.spec.ts"].cartAndCheckout.sku },
  });

  return prisma.order.create({
    data: {
      customerEmail: email,
      customerName: "Cliente i18n E2E",
      customerPhone: "70000000",
      items: {
        create: {
          brandSnapshot: product.brand,
          lineTotalCents: product.priceCents,
          productId: product.id,
          productNameSnapshot: product.name,
          quantity: 1,
          skuSnapshot: product.sku,
          taxCents: 0,
          unitPriceCents: product.priceCents,
        },
      },
      orderNumber: `CAP-I18N-${Date.now()}`,
      shipment: { create: { deliveryZone: "Santa Tecla", method: "LOCAL_DELIVERY" } },
      shippingCents: 0,
      status: "SHIPPED",
      subtotalCents: product.priceCents,
      taxCents: 0,
      totalCents: product.priceCents,
      userId: user.id,
    },
  });
}

test("the account area speaks the language of the page", async ({ page }) => {
  await signInCustomer(page, "i18n-account");

  await page.goto(ES("/account"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mi cuenta");
  await expect(page.getByText("Información personal")).toBeVisible();

  await page.goto(EN("/account"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("My account");
  await expect(page.getByText("Personal information")).toBeVisible();
  await expect(page.getByText("Account security")).toBeVisible();
});

test("the order tracking labels follow the language, and the identifiers do not", async ({
  page,
}) => {
  const email = await signInCustomer(page, "i18n-orders");
  await createShippedOrder(email);

  // El seguimiento devuelve identificadores y el catalogo los escribe. Este
  // test es la otra mitad del unitario: alli se verifica que cada identificador
  // tenga texto, aca que ese texto llegue traducido a la pantalla.
  await page.goto(ES("/account/orders"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mis pedidos");
  // El badge de estado esta dos veces en el DOM, uno por breakpoint: sin
  // filtrar por visible se engancha la copia oculta.
  await expect(page.locator("span:visible", { hasText: /^En camino$/ }).first()).toBeVisible();
  await expect(page.getByText("Entrega a domicilio")).toBeVisible();
  await expect(page.getByRole("button", { name: "Rastrear pedido" })).toBeVisible();

  await page.goto(EN("/account/orders"));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("My orders");
  await expect(page.locator("span:visible", { hasText: /^On the way$/ }).first()).toBeVisible();
  await expect(page.getByText("Home delivery")).toBeVisible();
  await expect(page.getByRole("button", { name: "Track order" })).toBeVisible();

  // Y el identificador crudo nunca llega a la pantalla: si el catalogo no
  // resolviera, se veria "inTransit" en vez de la etiqueta.
  await expect(page.getByText(/inTransit|readyForPickup|paymentProcessing/)).toHaveCount(0);
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
