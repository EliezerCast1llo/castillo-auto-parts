import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { hashOrderAccessToken } from "../../src/lib/order-access-token";
import { ES, prisma } from "./helpers";

// Explicit opt-in only; default dev/test/e2e never loads Google.
test.skip(!process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || !process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL,
  "Run with both public Google Ads test IDs to verify tracking with a mocked tag.");

test.afterAll(async () => { await prisma.$disconnect(); });

test("approved purchase sends real USD total once; pending/failed orders never convert", async ({ page, context }) => {
  await page.addInitScript(() => {
    (window as Window & { cspViolations?: string[] }).cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as Window & { cspViolations?: string[] }).cspViolations?.push(event.blockedURI);
    });
  });
  await context.route("https://www.googletagmanager.com/gtag/js?*", (route) => route.fulfill({
    contentType: "application/javascript", body: "/* Google is mocked: no third-party traffic. */",
  }));
  // Block any accidental integration traffic rather than allowing CI to contact Google.
  await context.route(/https:\/\/([^/]+\.)?(google\.com|google\.com\.sv|google-analytics\.com|doubleclick\.net|googleadservices\.com)\//,
    (route) => route.abort());
  const token = randomUUID();
  const orderNumber = `CAP-ADS-${randomUUID().slice(0, 8)}`;
  const order = await prisma.order.create({ data: {
    orderNumber, customerName: "Ads QA", customerEmail: "ads-qa@example.com", customerPhone: "70000000",
    accessTokenHash: hashOrderAccessToken(token), subtotalCents: 12000, taxCents: 0, shippingCents: 945, totalCents: 12945,
    payment: { create: { provider: "mock", amountCents: 12945, status: "PENDING" } },
  } });
  try {
    const path = ES(`/orders/${orderNumber}?token=${token}`);
    const conversions = () => page.evaluate(() => {
      const commands = (window as Window & { dataLayer?: IArguments[] }).dataLayer ?? [];
      return commands.map((args) => Array.from(args)).filter((args) => args[0] === "event" && args[1] === "conversion");
    });
    for (const status of ["PENDING", "FAILED"] as const) {
      await prisma.payment.update({ where: { orderId: order.id }, data: { status } });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.googleAdsConfigured === true);
      expect(await conversions()).toEqual([]);
      expect(await page.evaluate(() => (window as Window & { cspViolations?: string[] }).cspViolations)).toEqual([]);
    }
    await prisma.payment.update({ where: { orderId: order.id }, data: { status: "PAID" } });
    const response = await page.reload({ waitUntil: "networkidle" });
    const csp = response!.headers()["content-security-policy"] ?? response!.headers()["content-security-policy-report-only"];
    const nonce = csp.match(/'nonce-([^']+)'/)![1];
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`);
    expect(csp).not.toContain("'unsafe-eval'");
    await expect.poll(conversions).toEqual([["event", "conversion", {
      send_to: `${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}/${process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL}`,
      value: 129.45, currency: "USD", transaction_id: orderNumber,
    }]]);
    expect(await page.locator("#google-ads-tag").evaluate((script) => (script as HTMLScriptElement).nonce)).toBe(nonce);
    const config = await page.evaluate(() => {
      const commands = (window as Window & { dataLayer?: IArguments[] }).dataLayer ?? [];
      return commands.map((args) => Array.from(args)).find((args) => args[0] === "config");
    });
    expect(JSON.stringify(config)).not.toContain(token);
    expect(JSON.stringify(await conversions())).not.toMatch(/ads-qa@example|70000000|Ads QA/);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => window.googleAdsConfigured === true);
    expect(await conversions()).toEqual([]);
    expect(await page.evaluate(() => (window as Window & { cspViolations?: string[] }).cspViolations)).toEqual([]);
  } finally {
    await prisma.payment.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
  }
});
