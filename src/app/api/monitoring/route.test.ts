import { afterEach, expect, it, vi } from "vitest";
import { POST } from "./route";
const dsn = `https://${"b".repeat(32)}@o123.ingest.sentry.io/456`;
const request = (body: string, origin = "https://shop.test") => new Request("https://shop.test/api/monitoring", { method: "POST", headers: { origin, "content-type": "application/json" }, body });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("disabled relay does not send or read even malformed/hostile inputs", async () => {
  vi.stubEnv("SENTRY_DSN", "");
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  expect((await POST(request("malformed"))).status).toBe(204);
  expect(fetch).not.toHaveBeenCalled();
});
it("rejects foreign origins, oversized data, PII and unknown client codes", async () => {
  vi.stubEnv("SENTRY_DSN", dsn);
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  expect((await POST(request('{"kind":"client_error"}', "https://evil.test"))).status).toBe(403);
  expect((await POST(request("x".repeat(129)))).status).toBe(413);
  expect((await POST(request('{"kind":"client_error","email":"private@example.com"}'))).status).toBe(400);
  expect((await POST(request('{"kind":"token-secret"}'))).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
it("relays fixed client codes only, with a server-generated correlation ID and a bounded request budget", async () => {
  vi.stubEnv("SENTRY_DSN", dsn);
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 })); vi.stubGlobal("fetch", fetch);
  const output = vi.spyOn(console, "error").mockImplementation(() => {});
  expect((await POST(request('{"kind":"client_boundary"}'))).status).toBe(204);
  expect(fetch).toHaveBeenCalledOnce();
  expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({ context: "client_unhandled", outcome: "client_boundary", correlationId: expect.any(String) });
  let last;
  for (let i = 0; i < 25; i++) last = await POST(request('{"kind":"client_error"}'));
  expect(last?.status).toBe(429);
  expect(fetch.mock.calls.length).toBeLessThanOrEqual(20);
});
