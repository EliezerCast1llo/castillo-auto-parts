import { expect, test } from "@playwright/test";

test("the database healthcheck works without a session or locale redirect", async ({ request }) => {
  const response = await request.get("/api/health", { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  await expect(response.json()).resolves.toEqual({ ok: true });
});

test("the reservation scheduler rejects unauthenticated callers", async ({ request }) => {
  const response = await request.post("/api/internal/expire-payment-reservations");
  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toEqual({ ok: false, reason: "unauthorized" });
});
