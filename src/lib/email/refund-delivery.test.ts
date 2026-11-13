import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ send: vi.fn(), create: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { order: { findUniqueOrThrow: async () => ({ customerEmail: "qa@example.com", locale: "es" }) }, emailLog: { create: mocks.create, findFirst: mocks.find } } }));
vi.mock(".", () => ({ getTransactionalEmailFrom: () => "shop@example.com", getEmailProvider: () => ({ name: "fixture", sendEmail: mocks.send }) }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));
import { sendRefundNotification } from "./refund";
const records: Array<{ status: string; payloadJson: { notificationKey: string } }> = [];
beforeEach(() => {
  vi.resetAllMocks(); records.length = 0;
  mocks.create.mockImplementation(async ({ data }) => { records.push(data); return data; });
  mocks.find.mockImplementation(async ({ where }) => records.find(row => row.status === "SENT" && row.payloadJson.notificationKey === where.payloadJson.equals) ?? null);
});
it("audits FAILED then SENT, deduplicates later calls and does not affect another order", async () => {
  mocks.send.mockRejectedValueOnce(new Error("temporary failure")).mockResolvedValue({ provider: "fixture", status: "SENT", externalId: "sent-1" });
  expect(await sendRefundNotification("CAP-1")).toBe(true);
  expect(records.map(row => row.status)).toEqual(["FAILED", "SENT"]);
  expect(records.map(row => row.payloadJson.notificationKey)).toEqual(["order-refund-CAP-1", "order-refund-CAP-1"]);
  expect(await sendRefundNotification("CAP-1")).toBe(true);
  expect(mocks.send).toHaveBeenCalledTimes(2);
  expect(await sendRefundNotification("CAP-2")).toBe(true);
  expect(mocks.send).toHaveBeenCalledTimes(3);
});
it("does not retry an accepted delivery when its audit write fails", async () => {
  mocks.send.mockResolvedValue({ provider: "fixture", status: "SENT" });
  mocks.create.mockRejectedValue(new Error("audit unavailable"));
  expect(await sendRefundNotification("CAP-1")).toBe(true);
  expect(mocks.send).toHaveBeenCalledOnce();
});
