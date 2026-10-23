import { afterEach, expect, it, vi } from "vitest";
import { onRequestError, register } from "./instrumentation";
const validDsn = `https://${"a".repeat(32)}@o123.ingest.sentry.io/1`;
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each(["nodejs", "edge"])("warns at %s startup for a malformed DSN without exposing its value or sending telemetry", async (runtime) => {
  vi.stubEnv("NEXT_RUNTIME", runtime);
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("SENTRY_DSN", "https://private@example.com:token-secret@evil.test/1");
  vi.spyOn(process, "on").mockReturnValue(process);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  await expect(register()).resolves.toBeUndefined();
  expect(warn).toHaveBeenCalledOnce();
  const output = warn.mock.calls[0][0];
  expect(JSON.parse(output)).toMatchObject({ level: "warn", code: "INVALID_SENTRY_DSN" });
  expect(output).toContain("SENTRY_DSN");
  expect(output).not.toContain("private@example.com");
  expect(output).not.toContain("token-secret");
  expect(fetch).not.toHaveBeenCalled();
});
it.each([undefined, "", validDsn])("does not warn for an absent, empty or valid DSN: %s", async (dsn) => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs"); vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("SENTRY_DSN", dsn);
  vi.spyOn(process, "on").mockReturnValue(process);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  await register();
  expect(warn).not.toHaveBeenCalled();
});
it.each(["nodejs", "edge"])("keeps the diagnostic code local for unhandled %s errors", async (runtime) => {
  vi.stubEnv("NEXT_RUNTIME", runtime); vi.stubEnv("SENTRY_DSN", validDsn);
  const error = new TypeError("private@example.com token-secret");
  const output = vi.spyOn(console, "error").mockImplementation(() => {});
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 })); vi.stubGlobal("fetch", fetch);
  await onRequestError(error);
  expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({ context: "server_unhandled", errorCode: "TYPE_ERROR" });
  expect(fetch).toHaveBeenCalledOnce();
  const body = fetch.mock.calls[0][1].body;
  expect(body).not.toContain("errorCode"); expect(body).not.toContain("TYPE_ERROR"); expect(body).not.toContain(error.message);
});
