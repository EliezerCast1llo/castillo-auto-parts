import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminOrderStatusError } from "@/lib/admin-orders";
import { updateAdminOrderStatus } from "./actions";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), update: vi.fn(), requireAdmin: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/admin-auth", () => ({ requireAdminRole: mocks.requireAdmin }));
vi.mock("@/lib/db", () => ({ db: { $transaction: mocks.transaction } }));
vi.mock("@/lib/admin-orders", async (original) => ({ ...await original<typeof import("@/lib/admin-orders")>(), updateOrderStatusForAdmin: mocks.update }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
const form = () => { const data = new FormData(); data.set("orderNumber", "fixture-order"); data.set("status", "SHIPPED"); return data; };
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SENTRY_DSN", `https://${"a".repeat(32)}@o123.ingest.sentry.io/1`);
  mocks.transaction.mockImplementation(async (work) => work({}));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it.each(["invalid_transition", "not_found"] as const)("business validation %s preserves its redirect without reporting a failure", async (code) => {
  mocks.update.mockRejectedValue(new AdminOrderStatusError(code));
  await expect(updateAdminOrderStatus(form())).rejects.toThrow(`redirect:/admin/orders/fixture-order?estado=${code}`);
  expect(fetch).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
  const events = vi.mocked(console.log).mock.calls.map(([line]) => JSON.parse(line));
  expect(events.map((event) => event.outcome)).toEqual(["started", "rejected"]);
  expect(events[0].correlationId).toBe(events[1].correlationId);
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it("unexpected infrastructure errors are still reported with their local code and correlation", async () => {
  mocks.update.mockRejectedValue(new TypeError("private@example.com token-secret"));
  await expect(updateAdminOrderStatus(form())).rejects.toThrow("redirect:/admin/orders/fixture-order?estado=db_unavailable");
  expect(fetch).toHaveBeenCalledOnce();
  const local = JSON.parse(vi.mocked(console.error).mock.calls[0][0]);
  expect(local).toMatchObject({ context: "reconciliation", outcome: "failed", errorCode: "TYPE_ERROR" });
  const body = vi.mocked(fetch).mock.calls[0][1]?.body as string;
  expect(body).toContain(local.correlationId);
  expect(body).not.toContain("errorCode");
  expect(body).not.toContain("private@example.com");
});
