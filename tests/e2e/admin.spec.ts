import { expect, test } from "@playwright/test";

test("admin can sign in with configured local password", async ({ page }) => {
  await page.goto("/admin/login");

  await page.getByLabel("Contraseña").fill(process.env.ADMIN_ACCESS_PASSWORD || "admin123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.getByRole("heading", { exact: true, name: "Órdenes" })).toBeVisible();
});

test("admin can open stock alert operations", async ({ page }) => {
  await page.goto("/admin/login?next=%2Fadmin%2Fstock-alerts");

  await page.getByLabel("Contraseña").fill(process.env.ADMIN_ACCESS_PASSWORD || "admin123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/admin\/stock-alerts/);
  await expect(page.getByRole("heading", { name: "Avisos de disponibilidad" })).toBeVisible();
});
