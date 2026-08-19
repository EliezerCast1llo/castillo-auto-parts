import { expect, test, type Page } from "@playwright/test";
import { ES } from "./helpers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": testIpFor(testInfo.titlePath.join(" > ")),
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueEmail(prefix = "qa") {
  return `${prefix}-${Date.now()}@e2e.castilloautoparts.com`;
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

async function registerUser(page: Page, email: string, password = "TestPassword123!") {
  await page.goto(ES("/auth/register"));
  await page.getByLabel("Nombre completo").fill("Cliente Test E2E");
  await page.getByLabel("Correo electrónico").fill(email);

  // fill both password fields
  const passwordInputs = page.getByLabel("Contraseña");
  await passwordInputs.first().fill(password);
  await page.getByLabel("Confirmar contraseña").fill(password);

  await page.getByRole("button", { name: "Crear cuenta" }).click();
  // Should redirect to /account after registration
  await expect(page).toHaveURL(/\/account/);
}

async function loginUser(page: Page, email: string, password = "TestPassword123!") {
  await page.goto(ES("/auth/login"));
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/account/);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("customer can register with email and password", async ({ page }) => {
  const email = uniqueEmail("register");

  await page.goto(ES("/auth/register"));
  await page.getByLabel("Nombre completo").fill("Cliente Registro");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").first().fill("TestPassword123!");
  await page.getByLabel("Confirmar contraseña").fill("TestPassword123!");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/account/);
  await expect(page.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();

  // Verify user exists in DB
  const user = await prisma.user.findUnique({ where: { email } });
  expect(user).not.toBeNull();
  expect(user?.role).toBe("CUSTOMER");
});

test("customer can log in and log out", async ({ page }) => {
  const email = uniqueEmail("login");
  await registerUser(page, email);

  // Log out
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(ES("/"));

  // Log in again
  await loginUser(page, email);
  await expect(page.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
});

test("customer account keeps name and email read-only while phone is editable", async ({ page }) => {
  const email = uniqueEmail("profile");
  await registerUser(page, email);

  await expect(page.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
  await expect(page.getByText("Cliente Test E2E")).toBeVisible();
  await expect(page.getByText(email).first()).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Nombre completo" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Correo electrónico" })).toHaveCount(0);

  const phoneInput = page.getByRole("textbox", { name: "Teléfono" });
  await expect(phoneInput).toBeVisible();
  await phoneInput.fill("7777-8888");
  await page.getByRole("button", { name: "Guardar teléfono" }).click();

  await expect(page).toHaveURL(/\/account\?estado=updated/);
  await expect(page.getByText("Teléfono actualizado correctamente.")).toBeVisible();

  const user = await prisma.user.findUnique({ where: { email } });
  expect(user?.name).toBe("Cliente Test E2E");
  expect(user?.phone).toBe("7777-8888");
});

test("customer can view empty orders list", async ({ page }) => {
  const email = uniqueEmail("orders");
  await registerUser(page, email);

  await page.getByRole("link", { name: "Mis pedidos" }).click();
  await expect(page).toHaveURL(/\/account\/orders/);
  await expect(page.getByRole("heading", { name: "Mis pedidos" })).toBeVisible();
  await expect(page.getByText("Todavía no tienes pedidos")).toBeVisible();
});

test("customer can save an address after reviewing it", async ({ page }) => {
  const email = uniqueEmail("address");
  await registerUser(page, email);

  await page.goto(ES("/account/addresses"));
  await expect(page.getByRole("heading", { name: "Mis direcciones" })).toBeVisible();
  await page.getByRole("button", { name: "Nueva dirección" }).first().click();

  await page.getByLabel("Dirección").fill("12 avenida sur");
  await page.getByLabel("Referencia").fill("Casa 12");
  await page.getByLabel("Municipio").selectOption({ label: "Santa Tecla" });
  await page.getByRole("button", { name: "Revisar dirección" }).click();

  await expect(page.getByRole("heading", { name: "Confirma tu dirección" })).toBeVisible();
  await page.getByRole("button", { name: "Guardar dirección" }).click();

  await expect(page).toHaveURL(/\/account\/addresses\?estado=created/);
  await expect(page.getByText("Dirección guardada correctamente.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Confirma tu dirección" })).not.toBeVisible();

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const address = await prisma.address.findFirst({ where: { userId: user.id } });
  expect(address).toMatchObject({
    addressLine1: "12 avenida sur",
    addressLine2: "Casa 12",
    city: "Santa Tecla",
    department: "La Libertad",
  });
});

test("customer registers, adds to cart, and completes pickup checkout", async ({ page }) => {
  const email = uniqueEmail("checkout");
  await registerUser(page, email);

  // Add a product to cart
  await page.goto(ES("/catalog"));
  await page.getByRole("button", { name: "Agregar" }).first().click();
  await expect(page.getByText("Repuesto agregado al carrito")).toBeVisible();
  await expect(page).toHaveURL(/\/catalog$/);
  await page.getByRole("link", { name: /Ver carrito, 1 producto/ }).click();

  // Proceed to checkout
  await page.getByRole("link", { name: "Continuar al pago" }).click();
  await expect(page).toHaveURL(/\/checkout/);

  // Usuario autenticado: nombre y email se muestran como campos readonly (no editables)
  await expect(page.getByText("Cliente Test E2E")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Retiro en bodega" })).toBeVisible();

  await page.getByRole("button", { name: "Confirmar y pagar" }).click();

  await expect(page).toHaveURL(/\/payments\/mock\/MOCK-CAP-/);
  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(page).toHaveURL(/\/orders\/CAP-\d{8}-[A-Z0-9]{6}\?token=/);
  await expect(page.getByText("Orden creada")).toBeVisible();

  // Order should appear in user account
  await page.goto(ES("/account/orders"));
  await expect(page.getByRole("heading", { name: "Mis pedidos" })).toBeVisible();
  // Order list should NOT be empty anymore
  await expect(page.getByText("Todavía no tienes pedidos")).not.toBeVisible();
});

test("login shows error with wrong credentials", async ({ page }) => {
  await page.goto(ES("/auth/login"));
  await page.getByLabel("Correo electrónico").fill("noexiste@e2e.com");
  await page.getByLabel("Contraseña").fill("wrongpassword");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/auth\/login\?estado=invalid/);
  await expect(page.getByText("Email o contraseña incorrectos.")).toBeVisible();
});

test("login rate limit blocks repeated wrong credentials", async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `203.0.113.${10 + testInfo.workerIndex}`,
  });

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    await page.goto(ES("/auth/login"));
    await page.getByLabel("Correo electrónico").fill("rate-limit@e2e.castilloautoparts.com");
    await page.getByLabel("Contraseña").fill(`wrong-password-${attempt}`);
    await page.getByRole("button", { name: "Entrar" }).click();
  }

  await expect(page).toHaveURL(/\/auth\/login\?estado=rate_limited/);
  await expect(page.getByText("Demasiados intentos. Espera unos minutos e intenta de nuevo.")).toBeVisible();
});

test("register shows error with duplicate email", async ({ page }) => {
  const email = uniqueEmail("dup");
  await registerUser(page, email);

  // Log out y esperar que el redirect a "/" complete antes de continuar
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(ES("/"));

  // Try to register again with same email
  await page.goto(ES("/auth/register"));
  await page.getByLabel("Nombre completo").fill("Otro nombre");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").first().fill("TestPassword123!");
  await page.getByLabel("Confirmar contraseña").fill("TestPassword123!");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("Ya existe una cuenta con ese correo")).toBeVisible();
});

test("protected /account route redirects to login", async ({ page }) => {
  await page.goto(ES("/account"));
  await expect(page).toHaveURL(/\/auth\/login/);
});
