import { afterEach, expect, it, vi } from "vitest";
import { checkPendingPaymentBacklog } from "./pending-payment-monitoring";
const { count, warn } = vi.hoisted(() => ({ count: vi.fn(), warn: vi.fn() }));
vi.mock("./db", () => ({ db: { order: { count } } }));
vi.mock("./logger", () => ({ logWarn: warn, logError: warn }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("does not add database work without monitoring", async () => {
  vi.stubEnv("SENTRY_DSN", ""); await checkPendingPaymentBacklog(); expect(count).not.toHaveBeenCalled();
});
it("checks the 30-minute pending backlog and emits only a fixed warning", async () => {
  vi.stubEnv("SENTRY_DSN", `https://${"a".repeat(32)}@o123.ingest.sentry.io/1`);
  count.mockResolvedValue(2); const now = Date.now();
  await checkPendingPaymentBacklog();
  const query = count.mock.calls[0][0];
  expect(query.where.status).toBe("PAYMENT_PROCESSING");
  expect(query.where.createdAt.lt.getTime()).toBeGreaterThanOrEqual(now - 30 * 60_000);
  expect(warn).toHaveBeenCalledWith({ context: "reservation_cron", outcome: "pending_overdue" });
  count.mockResolvedValue(0); warn.mockClear(); await checkPendingPaymentBacklog(); expect(warn).not.toHaveBeenCalled();
});

it("contains monitoring-query failure so expiration can continue", async () => {
  vi.stubEnv("SENTRY_DSN", `https://${"a".repeat(32)}@o123.ingest.sentry.io/1`);
  count.mockRejectedValue(new Error("private@example.com secret"));
  await expect(checkPendingPaymentBacklog()).resolves.toBeUndefined();
  expect(warn).toHaveBeenCalledWith({ context: "reservation_cron", outcome: "failed" });
});
