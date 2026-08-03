import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Filtro por vehículo: selects dependientes, cookie "mi vehículo",
// badge de compatibilidad y landing /vehiculos/[make].
// ---------------------------------------------------------------------------

test("home vehicle selector narrows models without reload and filters catalog", async ({ page }) => {
  await page.goto("/");

  const makeSelect = page.locator('select[name="vehicleMake"]');
  const modelSelect = page.locator('select[name="vehicleModel"]');

  await makeSelect.selectOption("Toyota");

  // Los modelos se restringen en memoria (sin navegación)
  const modelOptions = await modelSelect.locator("option").allTextContents();
  expect(modelOptions).toContain("Corolla");
  expect(modelOptions).not.toContain("Sentra");
  await expect(page).toHaveURL("/");

  await modelSelect.selectOption("Corolla");
  await page.getByRole("button", { name: "Buscar compatibilidad" }).click();

  await expect(page).toHaveURL(/\/catalog\?.*vehicleMake=Toyota/);
  await expect(page.getByText("Filtro de aceite para Toyota 1.8L")).toBeVisible();
});

test("vehicle selection persists as cookie and pre-applies on catalog", async ({ page }) => {
  await page.goto("/");

  await page.locator('select[name="vehicleMake"]').selectOption("Toyota");
  await page.locator('select[name="vehicleModel"]').selectOption("Corolla");
  await page.getByRole("button", { name: "Buscar compatibilidad" }).click();
  await expect(page).toHaveURL(/vehicleMake=Toyota/);

  // Cookie guardada
  const cookies = await page.context().cookies();
  const vehicleCookie = cookies.find((cookie) => cookie.name === "castillo_my_vehicle");
  expect(vehicleCookie).toBeDefined();
  expect(decodeURIComponent(vehicleCookie!.value)).toContain("Toyota");

  // Visita limpia al catálogo: el filtro se pre-aplica desde la cookie
  await page.goto("/catalog");
  await expect(page.getByText("Mostrando repuestos para tu vehículo")).toBeVisible();

  // El badge de compatibilidad aparece en las cards
  await expect(page.getByText(/Compatible con tu Toyota Corolla/).first()).toBeVisible();

  // "Quitar" borra la cookie y el banner desaparece
  await page.getByRole("button", { name: "Quitar" }).click();
  await expect(page.getByText("Mostrando repuestos para tu vehículo")).toBeHidden();
});

test("vehicle make landing page lists compatible products", async ({ page }) => {
  await page.goto("/vehiculos/toyota");

  await expect(page.getByRole("heading", { name: "Repuestos para Toyota" })).toBeVisible();
  await expect(page.getByText("Filtro de aceite para Toyota 1.8L")).toBeVisible();

  // Marca inexistente → página 404 (el status llega 200 por streaming del
  // loading boundary; se asserta sobre el contenido renderizado)
  await page.goto("/vehiculos/marca-inexistente");
  await expect(page.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
});
