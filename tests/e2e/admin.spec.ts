import { expect, test, type Page } from "@playwright/test";
import { prisma } from "./helpers";
import { type UserRole } from "@prisma/client";
import { hashPassword } from "../../src/lib/admin-credentials";

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@castilloautoparts.com";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "admin123";
const ROLE_PASSWORD = "RolePassword123!";
const roleUserEmails: Partial<Record<UserRole, string>> = {};

test.beforeAll(async () => {
  const passwordHash = await hashPassword(ROLE_PASSWORD);
  const runId = `${Date.now()}`;

  for (const role of ["MARKETING", "SUPPORT", "ACCOUNTING"] as const) {
    const email = `${role.toLowerCase()}-${runId}@e2e.castilloautoparts.com`;
    await prisma.user.upsert({
      create: {
        email,
        isActive: true,
        name: `E2E ${role}`,
        passwordHash,
        role,
      },
      update: {
        isActive: true,
        passwordHash,
        role,
      },
      where: { email },
    });
    roleUserEmails[role] = email;
  }
});

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": testIpFor(testInfo.titlePath.join(" > ")),
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

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

test("ADMIN can open owner-only admin pages", async ({ page }) => {
  await loginAdmin(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin/users");
  await expect(page).toHaveURL(/\/admin\/users/);
  await expect(page.getByRole("heading", { name: "Usuarios admin" })).toBeVisible();

  await page.goto("/admin/audit");
  await expect(page).toHaveURL(/\/admin\/audit/);
  await expect(page.getByRole("heading", { name: "Auditoría" })).toBeVisible();

  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/settings/);
  await expect(page.getByRole("heading", { name: "Ajustes de entrega" })).toBeVisible();
});

test("MARKETING can access products but is redirected away from user admin", async ({ page }) => {
  await loginAdmin(page, roleUserEmails.MARKETING!, ROLE_PASSWORD, "/admin/products");
  await expect(page).toHaveURL(/\/admin\/products/);
  await expect(page.getByRole("heading", { name: "Productos e inventario" })).toBeVisible();

  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/admin\/products/);
  await expect(page.getByRole("heading", { name: "Productos e inventario" })).toBeVisible();
});

test("SUPPORT can access stock alerts but is redirected away from settings", async ({ page }) => {
  await loginAdmin(page, roleUserEmails.SUPPORT!, ROLE_PASSWORD, "/admin/stock-alerts");
  await expect(page).toHaveURL(/\/admin\/stock-alerts/);
  await expect(page.getByRole("heading", { name: "Avisos de disponibilidad" })).toBeVisible();

  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.getByRole("heading", { exact: true, name: "Órdenes" })).toBeVisible();
});

test("ACCOUNTING can access orders but is redirected away from product admin", async ({ page }) => {
  await loginAdmin(page, roleUserEmails.ACCOUNTING!, ROLE_PASSWORD, "/admin/orders");
  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.getByRole("heading", { exact: true, name: "Órdenes" })).toBeVisible();

  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.getByRole("heading", { exact: true, name: "Órdenes" })).toBeVisible();
});

async function loginAdmin(page: Page, email: string, password: string, nextPath: string) {
  await page.goto(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

function testIpFor(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const thirdOctet = (hash % 200) + 1;
  const fourthOctet = ((hash >>> 8) % 200) + 1;
  return `198.51.${thirdOctet}.${fourthOctet}`;
}
