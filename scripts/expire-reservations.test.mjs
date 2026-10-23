import assert from "node:assert/strict";
import { test } from "node:test";
import { runReservationCron } from "./expire-reservations.mjs";

const environment = {
  APP_BASE_URL: "https://shop.example.com",
  RESERVATION_CRON_SECRET: "fixture-cron-not-a-real-secret-more-than-32-characters",
};

test("cron posts the bearer token and drains full batches before exiting", async () => {
  const batches = [50, 2];
  let correlationId;
  const released = await runReservationCron({
    environment,
    fetchImplementation: async (endpoint, options) => {
      assert.equal(endpoint.toString(), "https://shop.example.com/api/internal/expire-payment-reservations");
      assert.equal(options.method, "POST");
      assert.equal(options.redirect, "error");
      assert.equal(options.headers.authorization, `Bearer ${environment.RESERVATION_CRON_SECRET}`);
      assert.ok(options.signal instanceof AbortSignal);
      assert.match(options.headers["x-correlation-id"], /^[a-f0-9-]{36}$/);
      correlationId ??= options.headers["x-correlation-id"];
      assert.equal(options.headers["x-correlation-id"], correlationId);
      return Response.json({ ok: true, released: batches.shift() });
    },
  });
  assert.equal(released, 52);
  assert.equal(batches.length, 0);
});

test("cron refuses missing credentials and non-HTTPS origins before making requests", async () => {
  for (const change of [{ RESERVATION_CRON_SECRET: "" }, { APP_BASE_URL: "http://shop.example.com" }]) {
    await assert.rejects(runReservationCron({ environment: { ...environment, ...change }, fetchImplementation: () => assert.fail("unexpected request") }));
  }
});

test("cron reports HTTP failure without echoing a response body", async () => {
  await assert.rejects(runReservationCron({
    environment,
    fetchImplementation: async () => new Response("sensitive server body", { status: 401 }),
  }), { message: "Reservation cron failed (HTTP 401)" });
});

test("cron masks network errors and their credentials", async () => {
  await assert.rejects(runReservationCron({
    environment,
    fetchImplementation: async () => { throw new Error(`failed for ${environment.RESERVATION_CRON_SECRET}`); },
  }), { message: "Reservation cron request failed or timed out" });
});

test("cron rejects invalid success payloads", async () => {
  for (const payload of [{ ok: false }, { ok: true, released: -1 }, { ok: true, released: 51 }]) {
    await assert.rejects(runReservationCron({ environment, fetchImplementation: async () => Response.json(payload) }), { message: "Reservation cron received an invalid response" });
  }
});

test("cron exits with an actionable failure when its bounded backlog budget is exhausted", async () => {
  let requests = 0;
  await assert.rejects(runReservationCron({
    environment,
    fetchImplementation: async () => { requests += 1; return Response.json({ ok: true, released: 50 }); },
  }), /500-order limit/);
  assert.equal(requests, 10);
});
