import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { height: 844, name: "mobile", width: 390 },
  { height: 1024, name: "tablet", width: 768 },
];

const customerPages = [
  {
    heading: "Encuentra repuestos compatibles con tu vehículo",
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
  {
    heading: "Datos de entrega y pago",
    path: "/checkout",
    setup: async (page: Page) => {
      await addProductToCart(page, "bujia-iridio-hyundai-kia-16l");
      await page.getByRole("link", { name: "Continuar al pago" }).click();
    },
  },
];

const adminPages = [
  {
    heading: "Órdenes",
    path: "/admin/orders",
  },
  {
    heading: "Productos e inventario",
    path: "/admin/products",
  },
  {
    heading: "Avisos de disponibilidad",
    path: "/admin/stock-alerts",
  },
];

for (const viewport of viewports) {
  test.describe(`responsive customer pages on ${viewport.name}`, () => {
    test.use({ viewport });

    for (const customerPage of customerPages) {
      test(`${customerPage.path} fits without horizontal overflow`, async ({ page }) => {
        if (typeof customerPage.setup === "function") {
          await customerPage.setup(page);
        } else {
          await page.goto(customerPage.path);
        }

        await expect(
          page.getByRole("heading", { exact: true, name: customerPage.heading }),
        ).toBeVisible();

        await expectNoHorizontalOverflow(page);
      });
    }
  });

  test.describe(`responsive admin pages on ${viewport.name}`, () => {
    test.use({ viewport });

    for (const adminPage of adminPages) {
      test(`${adminPage.path} fits without horizontal overflow`, async ({ page }) => {
        await signInAdmin(page, adminPage.path);

        await expect(
          page.getByRole("heading", { exact: true, name: adminPage.heading }),
        ).toBeVisible();

        await expectNoHorizontalOverflow(page);
      });
    }
  });
}

async function addProductToCart(page: Page, slug: string) {
  await page.goto(`/product/${slug}`);
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page).toHaveURL(/\/cart\?estado=added/);
}

async function signInAdmin(page: Page, nextPath: string) {
  await page.goto(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  await page.getByLabel("Correo electrónico").fill(
    process.env.ADMIN_SEED_EMAIL || "admin@castilloautoparts.com",
  );
  await page.getByLabel("Contraseña").fill(process.env.ADMIN_SEED_PASSWORD || "admin123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(new RegExp(nextPath.replace(/\//g, "\\/")));
}

async function expectNoHorizontalOverflow(page: Page) {
  const viewportFit = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(viewportFit.scrollWidth).toBeLessThanOrEqual(viewportFit.clientWidth + 1);
}
