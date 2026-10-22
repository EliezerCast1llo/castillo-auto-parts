import { expect, test, type Page } from "@playwright/test";
import { ES } from "./helpers";

// ---------------------------------------------------------------------------
// Filtro por vehículo: selects dependientes, cookie "mi vehículo",
// badge de compatibilidad y landing /vehiculos/[make].
// ---------------------------------------------------------------------------

/** Total de resultados que anuncia la barra del catálogo ("N productos"). */
async function catalogTotal(page: Page) {
  const label = await page
    .locator("span", { hasText: /^\d+ productos?$/ })
    .first()
    .innerText();

  return Number(label.replace(/\D/g, ""));
}

test("home vehicle selector narrows models without reload and filters catalog", async ({ page }) => {
  await page.goto(ES("/"));

  const makeSelect = page.locator('select[name="vehicleMake"]');
  const modelSelect = page.locator('select[name="vehicleModel"]');
  const yearSelect = page.locator('select[name="vehicleYear"]');
  const submit = page.getByRole("button", { name: "Buscar repuestos" });

  // Cada paso se habilita solo cuando el anterior está elegido
  await expect(modelSelect).toBeDisabled();
  await expect(yearSelect).toBeDisabled();
  await expect(submit).toBeDisabled();

  await makeSelect.selectOption("Toyota");
  await expect(modelSelect).toBeEnabled();
  await expect(yearSelect).toBeDisabled();

  // Los modelos se restringen en memoria (sin navegación)
  const modelOptions = await modelSelect.locator("option").allTextContents();
  expect(modelOptions).toContain("Corolla");
  expect(modelOptions).not.toContain("Sentra");
  await expect(page).toHaveURL(ES("/"));

  await modelSelect.selectOption("Corolla");
  await expect(yearSelect).toBeEnabled();
  // Falta el año: la búsqueda sigue bloqueada
  await expect(submit).toBeDisabled();

  await yearSelect.selectOption("2015");
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page).toHaveURL(/\/catalog\?.*vehicleMake=Toyota/);
  await expect(page.getByText("Filtro de aceite para Toyota 1.8L")).toBeVisible();
});

test("vehicle selection persists as cookie and pre-applies on catalog", async ({ page }) => {
  await page.goto(ES("/"));

  await page.locator('select[name="vehicleMake"]').selectOption("Toyota");
  await page.locator('select[name="vehicleModel"]').selectOption("Corolla");
  await page.locator('select[name="vehicleYear"]').selectOption("2015");
  await page.getByRole("button", { name: "Buscar repuestos" }).click();
  await expect(page).toHaveURL(/vehicleMake=Toyota/);

  // Cookie guardada
  const cookies = await page.context().cookies();
  const vehicleCookie = cookies.find((cookie) => cookie.name === "castillo_my_vehicle");
  expect(vehicleCookie).toBeDefined();
  expect(decodeURIComponent(vehicleCookie!.value)).toContain("Toyota");

  // Visita limpia al catálogo: el filtro se pre-aplica desde la cookie
  await page.goto(ES("/catalog"));
  await expect(page.getByText("Filtrando repuestos para tu vehículo")).toBeVisible();

  // El badge de compatibilidad aparece en las cards
  await expect(page.getByText(/Compatible con tu Toyota Corolla/).first()).toBeVisible();

  const filteredTotal = await catalogTotal(page);

  // "Quitar" borra la cookie: se comprueba el efecto (el catálogo deja de
  // estar filtrado), no solo que el aviso se vaya — ocultarlo en cliente
  // bastaría para pasar con el filtro todavía aplicado.
  await page.getByRole("button", { name: "Quitar" }).click();

  await expect(page.getByText("Filtrando repuestos para tu vehículo")).toBeHidden();
  await expect(page.getByText(/Compatible con tu Toyota Corolla/)).toHaveCount(0);
  await expect.poll(() => catalogTotal(page)).toBeGreaterThan(filteredTotal);
});

test("vehicle make landing page lists compatible products", async ({ page }) => {
  await page.goto(ES("/vehiculos/toyota"));

  await expect(page.getByRole("heading", { name: "Repuestos para Toyota" })).toBeVisible();
  await expect(page.getByText("Filtro de aceite para Toyota 1.8L")).toBeVisible();

  // Marca inexistente → página 404 (el status llega 200 por streaming del
  // loading boundary; se asserta sobre el contenido renderizado)
  await page.goto(ES("/vehiculos/marca-inexistente"));
  await expect(page.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
});
