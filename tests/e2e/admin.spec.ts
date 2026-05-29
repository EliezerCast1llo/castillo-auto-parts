import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@castilloautoparts.com";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "admin123";

test("admin can sign in with email and password", async ({ page }) => {
  await page.goto("/admin/login");

  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.getByRole("heading", { exact: true, name: "Órdenes" })).toBeVisible();
});

test("admin can open stock alert operations", async ({ page }) => {
  await page.goto("/admin/login?next=%2Fadmin%2Fstock-alerts");

  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/admin\/stock-alerts/);
  await expect(page.getByRole("heading", { name: "Avisos de disponibilidad" })).toBeVisible();
});
