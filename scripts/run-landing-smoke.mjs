import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

// Preserve the session's proxy/CA/credential guards; remove only application settings.
const environment = { ...process.env };
const example = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
for (const [, key] of example.matchAll(/^([A-Z][A-Z0-9_]+)=/gm)) delete environment[key];
for (const key of Object.keys(environment)) {
  if (/^(E2E_|PLAYWRIGHT_|AUTH_|VERCEL_|SENTRY_|WOMPI_|UPSTASH_|CLOUDFLARE_|NEXT_PUBLIC_)/.test(key)) delete environment[key];
}
for (const file of [".env", ".env.local", ".env.production", ".env.production.local"]) {
  assert(!existsSync(file), "Landing smoke requires a checkout without local dotenv files; do not move secrets into CI.");
}
Object.assign(environment, { SITE_MODE: "landing", NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" });
assert(!("DATABASE_URL" in environment), "Database settings must be absent");
assert(!("NEXTAUTH_SECRET" in environment), "Auth settings must be absent");
const port = process.env.LANDING_SMOKE_PORT || "3211";
const origin = `http://localhost:${port}`;

async function build() {
  const child = spawn("npm", ["run", "build"], { env: environment, stdio: "inherit" });
  const code = await new Promise((resolve, reject) => { child.on("error", reject); child.on("exit", resolve); });
  assert.equal(code, 0, "Secret-free landing build must pass");
}

let server;
let browser;
try {
  await build();
  const manifest = JSON.parse(readFileSync(".next/server/app-paths-manifest.json", "utf8"));
  assert(Object.keys(manifest).some((path) => path === "/(temporary)/page"));
  assert(Object.keys(manifest).every((path) => !/catalog|cart|checkout|account|admin|auth|api|sitemap/.test(path)), "Store routes must not be bundled");
  const trace = JSON.parse(readFileSync(".next/server/app/(temporary)/page.js.nft.json", "utf8"));
  assert(!trace.files.some((file) => /@prisma|@auth|next-auth|resend|@aws-sdk|@sentry|upstash/.test(file)), "Landing must not trace store service dependencies");
  server = spawn("npm", ["start", "--", "--port", port], { env: environment, stdio: "inherit", detached: true });
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 60_000;
    server.once("error", reject);
    const check = async () => {
      if (server.exitCode !== null) return reject(new Error("Secret-free landing server exited"));
      try { const response = await fetch(origin); if (response.status === 200) return resolve(); } catch {}
      if (Date.now() > deadline) return reject(new Error("Landing startup timeout"));
      setTimeout(check, 200);
    };
    void check();
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", (request) => { if (!request.url().startsWith(`${origin}/`)) external.push(request.url()); });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    const response = await page.goto(origin, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    const headers = response.headers();
    assert(headers["content-security-policy"]?.includes("frame-ancestors 'none'"), "Landing must enforce CSP");
    assert.equal(headers["x-content-type-options"], "nosniff");
    assert.equal(await page.locator("html").getAttribute("lang"), "es");
    assert.match(await page.title(), /Castillo Autoparts/);
    assert(await page.getByRole("link", { name: "Castillo Autoparts", exact: true }).isVisible());
    assert(await page.getByText("Repuestos automotrices en línea para Santa Tecla, San Salvador y alrededores.", { exact: true }).isVisible());
    assert.equal(await page.getByRole("link", { name: "Escríbenos por WhatsApp" }).getAttribute("href"), "https://wa.me/50378907671");
    assert.equal(await page.getByRole("link", { name: "+503 7890 7671", exact: true }).getAttribute("href"), "tel:+50378907671");
    assert.equal(await page.locator("form,input").count(), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    mkdirSync("test-results/landing", { recursive: true });
    await page.screenshot({ path: `test-results/landing/${width}.png`, fullPage: true });
  }
  assert.deepEqual(errors, [], "No browser or CSP errors");
  assert.deepEqual(external, [], "No third-party requests");
  assert.deepEqual(await context.cookies(), [], "No session or tracking cookies");
  for (const path of ["/catalog", "/es/catalog", "/en/catalog", "/cart", "/es/cart", "/checkout", "/es/checkout", "/account", "/es/account", "/auth/login", "/es/auth/login", "/admin", "/admin/login", "/api/auth/session", "/api/health", "/api/monitoring", "/api/webhooks/wompi", "/api/internal/expire-payment-reservations", "/sitemap.xml", "/robots.txt", "/_next/image?url=https://example.com/image.jpg&w=64&q=75"]) {
    const response = await context.request.get(`${origin}${path}`, { maxRedirects: 0 });
    assert.equal(response.status(), 404, `${path} must be disabled without invoking services`);
    assert(response.headers()["content-security-policy"], "Disabled routes retain CSP");
  }
  for (const path of ["/", "/es/checkout", "/admin", "/api/auth/callback/credentials", "/api/webhooks/wompi", "/api/monitoring"]) {
    const response = await context.request.post(`${origin}${path}`, { data: {} });
    assert.equal(response.status(), 404, "Mutations must be disabled");
  }
  console.log("Landing smoke passed: secret-free build/start, isolated routes, CSP, zero external requests/errors and 3 responsive viewports.");
} finally {
  await browser?.close();
  if (server?.pid) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    try { process.kill(-server.pid, "SIGTERM"); } catch {}
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 3000))]);
    try { process.kill(-server.pid, "SIGKILL"); } catch {}
  }
}
