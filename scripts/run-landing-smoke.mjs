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
const withGoogleAds = process.argv.includes("--google-ads");
const adsId = "AW-123456789";
if (withGoogleAds) environment.NEXT_PUBLIC_GOOGLE_ADS_ID = adsId;

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
  assert(Object.keys(manifest).every((path) => !/catalog|cart|checkout|account|admin|auth|api/.test(path)), "Store routes must not be bundled");
  assert(Object.keys(manifest).some((path) => path.includes("robots.txt")));
  assert(Object.keys(manifest).some((path) => path.includes("sitemap.xml")));
  const clientManifest = readFileSync(".next/server/app/(temporary)/page_client-reference-manifest.js", "utf8");
  assert(!clientManifest.includes("google-ads-purchase"), "Purchase conversion must not be bundled in landing");
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
  // No traffic reaches Google, even when testing the opt-in configuration in CI.
  await context.route("https://www.googletagmanager.com/gtag/js?*", (route) => route.fulfill({
    contentType: "application/javascript", body: "window.__googleAdsMockLoaded = true;",
  }));
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => window.__cspViolations.push(event.blockedURI));
  });
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
    const csp = headers["content-security-policy"];
    const nonce = csp.match(/'nonce-([^']+)'/)[1];
    assert(!csp.split("; ").find((item) => item.startsWith("script-src ")).includes("unsafe-"));
    if (withGoogleAds) {
      assert(csp.includes("https://www.googletagmanager.com"));
      assert(csp.includes("https://googleads.g.doubleclick.net"));
      assert.equal(await page.locator("#google-ads-tag").evaluate((script) => script.nonce), nonce);
      assert.equal(await page.locator("#google-ads-config").evaluate((script) => script.nonce), nonce);
      assert.equal(await page.locator("#google-ads-tag").getAttribute("src"), `https://www.googletagmanager.com/gtag/js?id=${adsId}`);
      const commands = await page.evaluate(() => window.dataLayer.map((args) => Array.from(args)));
      assert.equal(commands[0][0], "js");
      assert.equal(commands[1][0], "config");
      assert.equal(commands[1][1], adsId);
      assert.equal(await page.evaluate(() => window.__googleAdsMockLoaded), true);
    } else {
      assert.equal(await page.locator("#google-ads-tag, #google-ads-config").count(), 0);
      assert(!csp.includes("googletagmanager.com"));
    }
    assert.deepEqual(await page.evaluate(() => window.__cspViolations), []);
    assert.equal(headers["x-content-type-options"], "nosniff");
    assert.equal(await page.locator("html").getAttribute("lang"), "es");
    assert.match(await page.title(), /Castillo Autoparts/);
    assert(await page.getByRole("link", { name: "Castillo Autoparts", exact: true }).isVisible());
    assert(await page.getByText("Repuestos automotrices en línea con envíos a todo El Salvador.", { exact: true }).isVisible());
    assert.equal(await page.getByRole("link", { name: "Escríbenos por WhatsApp" }).getAttribute("href"), "https://wa.me/50378907671");
    assert.equal(await page.getByRole("link", { name: "+503 7890 7671", exact: true }).getAttribute("href"), "tel:+50378907671");
    assert.equal(await page.locator("form,input").count(), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    mkdirSync("test-results/landing", { recursive: true });
    await page.screenshot({ path: `test-results/landing/${width}.png`, fullPage: true });
  }
  assert.deepEqual(errors, [], "No browser or CSP errors");
  assert(external.every((url) => withGoogleAds && url === `https://www.googletagmanager.com/gtag/js?id=${adsId}`), "Only the mocked opt-in Google tag may be requested");
  assert.deepEqual(await context.cookies(), [], "No session or tracking cookies");
  const adsBot = await context.request.get(origin, { headers: { "User-Agent": "AdsBot-Google" }, maxRedirects: 0 });
  assert.equal(adsBot.status(), 200, "AdsBot-Google must receive the landing directly");
  assert.equal(adsBot.headers().location, undefined);
  const robots = await context.request.get(`${origin}/robots.txt`);
  assert.equal(robots.status(), 200);
  assert.match(await robots.text(), /User-Agent: \*\s+Allow: \//i);
  assert(!(await robots.text()).includes("Disallow:"));
  assert((await robots.text()).includes("Sitemap: https://castillo-auto-parts.vercel.app/sitemap.xml"));
  // Los rastreadores de asistentes se nombran uno por uno: varios solo entran
  // cuando se los nombra, y que estén escritos deja constancia de que fue una
  // decisión. Si alguien los quita, esto lo dice.
  for (const agent of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot"]) {
    assert.match(await robots.text(), new RegExp(`User-Agent: ${agent}\\s+Allow: /`), `${agent} must be allowed by name`);
  }
  const sitemap = await context.request.get(`${origin}/sitemap.xml`);
  assert.equal(sitemap.status(), 200);
  const sitemapBody = await sitemap.text();
  assert.deepEqual([...sitemapBody.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]), ["https://castillo-auto-parts.vercel.app/", "https://castillo-auto-parts.vercel.app/en"]);
  // Sin los alternates, un buscador trata el inglés como contenido duplicado
  // del español en vez de indexarlo aparte.
  for (const lang of ["es", "en", "x-default"]) {
    assert(sitemapBody.includes(`hreflang="${lang}"`), `sitemap must declare the ${lang} alternate`);
  }
  // La versión en inglés es una URL propia, no una cookie: es lo único que
  // permite que se pueda indexar, compartir y abrir en otra pestaña.
  const english = await page.goto(`${origin}/en`);
  assert.equal(english.status(), 200);
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  assert(await page.getByText("Automotive parts online with shipping throughout El Salvador.", { exact: true }).isVisible());
  assert.equal(await page.getByRole("link", { name: "ES", exact: true }).getAttribute("href"), "/");
  assert.equal(await page.locator("form,input").count(), 0);
  // Los datos estructurados son lo que hace que un buscador o un asistente
  // entiendan qué negocio es este. No pueden declarar lo que no existe.
  for (const path of ["/", "/en"]) {
    await page.goto(`${origin}${path}`);
    const jsonLd = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    assert.equal(jsonLd["@type"], "AutoPartsStore");
    assert.equal(jsonLd.areaServed.name, "El Salvador");
    for (const invented of ["address", "openingHours", "openingHoursSpecification", "aggregateRating", "priceRange", "review"]) {
      assert(!(invented in jsonLd), `structured data must not invent ${invented}`);
    }
  }
  for (const path of ["/catalog", "/es/catalog", "/en/catalog", "/cart", "/es/cart", "/checkout", "/es/checkout", "/account", "/es/account", "/auth/login", "/es/auth/login", "/admin", "/admin/login", "/api/auth/session", "/api/health", "/api/monitoring", "/api/webhooks/wompi", "/api/internal/expire-payment-reservations", "/_next/image?url=https://example.com/image.jpg&w=64&q=75"]) {
    const response = await context.request.get(`${origin}${path}`, { maxRedirects: 0 });
    assert.equal(response.status(), 404, `${path} must be disabled without invoking services`);
    assert(response.headers()["content-security-policy"], "Disabled routes retain CSP");
  }
  for (const path of ["/", "/es/checkout", "/admin", "/api/auth/callback/credentials", "/api/webhooks/wompi", "/api/monitoring"]) {
    const response = await context.request.post(`${origin}${path}`, { data: {} });
    assert.equal(response.status(), 404, "Mutations must be disabled");
  }
  console.log(`Landing smoke passed (${withGoogleAds ? "mocked Google Ads" : "no Google Ads"}): secret-free build/start, isolated store routes, CSP/nonces, robots/sitemap, AdsBot 200 and 3 responsive viewports.`);
} finally {
  await browser?.close();
  if (server?.pid) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    try { process.kill(-server.pid, "SIGTERM"); } catch {}
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 3000))]);
    try { process.kill(-server.pid, "SIGKILL"); } catch {}
  }
}
