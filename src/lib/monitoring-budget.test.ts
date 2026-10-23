import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { sanitizeMonitoringEvent } from "./monitoring-event";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("SENTRY_DSN", `https://${"a".repeat(32)}@o123.ingest.sentry.io/1`);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it("exhausting the public relay does not spend the server's per-minute allowance", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  const { POST } = await import("../app/api/monitoring/route");
  const { logError } = await import("./logger");
  const request = () => new Request("https://shop.test/api/monitoring", { method: "POST",
    headers: { origin: "https://shop.test", "content-type": "application/json" }, body: '{"kind":"client_error"}' });
  for (let i = 0; i < 20; i++) expect((await POST(request())).status).toBe(204);
  expect(fetch).toHaveBeenCalledTimes(20);
  expect((await POST(request())).status).toBe(429);
  for (let i = 0; i < 20; i++) await logError({ context: "wompi_webhook", outcome: "failed" });
  expect(fetch).toHaveBeenCalledTimes(40);
  const events = fetch.mock.calls.map(([, options]) => JSON.parse(options.body.split("\n")[2]));
  expect(events.slice(20).every((event) => event.tags.operation === "wompi_webhook")).toBe(true);
  await logError({ context: "checkout", outcome: "failed" });
  expect(fetch).toHaveBeenCalledTimes(40);
});

it("client in-flight requests cannot occupy the server's concurrency slots", async () => {
  const completions: Array<() => void> = [];
  const fetch = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => {
    completions.push(() => resolve(new Response(null, { status: 200 })));
  }));
  vi.stubGlobal("fetch", fetch);
  const { sendMonitoringEvent } = await import("./monitoring");
  const client = sanitizeMonitoringEvent("error", { context: "client_unhandled" });
  const server = sanitizeMonitoringEvent("error", { context: "checkout" });
  const pending = [sendMonitoringEvent(client), sendMonitoringEvent(client)];
  await sendMonitoringEvent(client);
  expect(fetch).toHaveBeenCalledTimes(2);
  pending.push(sendMonitoringEvent(server), sendMonitoringEvent(server));
  await sendMonitoringEvent(server);
  expect(fetch).toHaveBeenCalledTimes(4);
  completions.forEach((complete) => complete());
  await Promise.all(pending);
  // Successful completion releases only its own pool's slots.
  fetch.mockResolvedValue(new Response(null, { status: 200 }));
  await sendMonitoringEvent(server);
  await sendMonitoringEvent(client);
  expect(fetch).toHaveBeenCalledTimes(6);
});
