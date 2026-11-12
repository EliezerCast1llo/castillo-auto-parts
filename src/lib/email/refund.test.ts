import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ order: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { order: { findUniqueOrThrow: mocks.order } } }));
vi.mock("./audited-delivery", () => ({ sendAuditedEmail: mocks.send }));
import { sendRefundNotification } from "./refund";
beforeEach(() => { vi.clearAllMocks(); mocks.send.mockResolvedValue(true); });
it.each([["es", "Reembolso registrado"], ["en", "Refund recorded"]])("sends an audited refund notification in %s", async (locale, title) => {
  mocks.order.mockResolvedValue({ customerEmail: "qa@example.com", locale });
  await sendRefundNotification("CAP-1");
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "qa@example.com", subject: `${title}: CAP-1`, idempotencyKey: "order-refund-CAP-1" }), "order_refund");
});
