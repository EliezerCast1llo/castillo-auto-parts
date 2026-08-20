import { expect, test } from "@playwright/test";
import { EN, ES } from "./helpers";

test("a first-time visitor sees the notice and can dismiss it for good", async ({ context, page }) => {
  await page.goto(ES("/catalog"));

  const banner = page.getByRole("region", { name: "Usamos cookies" });
  await expect(banner).toBeVisible();

  await banner.getByRole("button", { name: "Aceptar" }).click();
  await expect(banner).toBeHidden();

  const consent = (await context.cookies()).find(
    (cookie) => cookie.name === "castillo_cookie_consent",
  );
  expect(consent?.value).toBe("v1");
  // El cliente la escribe con document.cookie, asi que no puede ser httpOnly.
  expect(consent?.httpOnly).toBe(false);

  // Y no vuelve a aparecer en la siguiente navegacion.
  await page.goto(ES("/cart"));
  await expect(page.getByRole("region", { name: "Usamos cookies" })).toHaveCount(0);
});

test("the notice is server-rendered, so it never flashes for someone who accepted", async ({
  baseURL,
  context,
  page,
}) => {
  await context.addCookies([
    { name: "castillo_cookie_consent", value: "v1", url: baseURL! },
  ]);

  const response = await page.goto(ES("/catalog"));
  const html = (await response?.text()) ?? "";

  // Se busca el marcado del aviso, no su texto: las traducciones del namespace
  // viajan serializadas en el payload del provider aunque no se renderice nada,
  // asi que buscar "Usamos cookies" daria un falso positivo. Y se busca su
  // data-testid y no `role="region"` a secas, para no fallar el dia que la
  // pagina gane otro landmark por razones ajenas al consentimiento.
  expect(html).not.toContain('data-testid="cookie-consent"');
  await expect(page.getByTestId("cookie-consent")).toHaveCount(0);
});

test("the notice speaks the language of the page", async ({ page }) => {
  await page.goto(EN("/catalog"));

  await expect(page.getByRole("region", { name: "We use cookies" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
});

test("a stale consent version asks again", async ({ baseURL, context, page }) => {
  await context.addCookies([
    { name: "castillo_cookie_consent", value: "v0", url: baseURL! },
  ]);

  await page.goto(ES("/catalog"));

  await expect(page.getByRole("region", { name: "Usamos cookies" })).toBeVisible();
});
