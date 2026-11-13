import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ order: vi.fn(), send: vi.fn(), sent: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { order: { findUniqueOrThrow: mocks.order }, emailLog: { findFirst: mocks.sent } } }));
vi.mock("./audited-delivery", () => ({ sendAuditedEmail: mocks.send }));
import { sendRefundNotification } from "./refund";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.order.mockResolvedValue({ customerEmail: "qa@example.com", locale: "es" });
  mocks.sent.mockResolvedValue(null);
  mocks.send.mockResolvedValue(true);
});
it.each([["es", "Reembolso registrado"], ["en", "Refund recorded"]])("sends an audited refund notification in %s once on success", async (locale, title) => {
  mocks.order.mockResolvedValue({ customerEmail: "qa@example.com", locale });
  expect(await sendRefundNotification("CAP-1")).toBe(true);
  expect(mocks.send).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ to: "qa@example.com", subject: `${title}: CAP-1`, idempotencyKey: "order-refund-CAP-1" }), "order_refund");
});
it("retries a failure once with the same key and message, then stops on success", async () => {
  mocks.send.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  expect(await sendRefundNotification("CAP-1")).toBe(true);
  expect(mocks.send).toHaveBeenCalledTimes(2);
  const [first, second] = mocks.send.mock.calls.map(([message]) => message);
  expect(second).toMatchObject({ idempotencyKey: first.idempotencyKey, subject: first.subject, html: first.html, text: first.text });
  expect(first.signal).toBeInstanceOf(AbortSignal);
  expect(second.signal).not.toBe(first.signal);
});
it("caps repeated failures at two attempts", async () => {
  mocks.send.mockResolvedValue(false);
  expect(await sendRefundNotification("CAP-1")).toBe(false);
  expect(mocks.send).toHaveBeenCalledTimes(2);
});
it("skips a notification already recorded as sent for this order", async () => {
  mocks.sent.mockResolvedValue({ id: "sent-log" });
  expect(await sendRefundNotification("CAP-1")).toBe(true);
  expect(mocks.sent).toHaveBeenCalledWith(expect.objectContaining({ where: { template: "order_refund", status: "SENT", payloadJson: { path: ["notificationKey"], equals: "order-refund-CAP-1" } } }));
  expect(mocks.send).not.toHaveBeenCalled();
});
