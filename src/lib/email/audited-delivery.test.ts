import { beforeEach, expect, it, vi } from "vitest";
import { sendAuditedEmail } from "./audited-delivery";
const mocks = vi.hoisted(() => ({ send: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { emailLog: { create: mocks.create } } }));
vi.mock(".", () => ({ getEmailProvider: () => ({ name: "fixture", sendEmail: mocks.send }) }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));
const message = { from: "shop@example.com", to: "customer@example.com", subject: "Código 123456", text: "OTP 123456", html: "<p>OTP 123456</p>" };
beforeEach(() => { vi.clearAllMocks(); mocks.create.mockResolvedValue({}); });
it("logs delivery metadata without ever persisting OTPs or bodies", async () => {
  mocks.send.mockResolvedValue({ provider: "fixture", status: "SENT", externalId: "msg1" });
  expect(await sendAuditedEmail(message, "two_factor_code")).toBe(true);
  expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: "SENT", template: "two_factor_code", externalId: "msg1" }) });
  expect(JSON.stringify(mocks.create.mock.calls)).not.toContain("123456");
  expect(JSON.stringify(mocks.create.mock.calls)).not.toContain("html");
});
it("records failures using a safe code and reports delivery unavailable", async () => {
  mocks.send.mockRejectedValue(new Error("OTP 123456"));
  expect(await sendAuditedEmail(message, "two_factor_code")).toBe(false);
  expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: "FAILED" }) });
  expect(JSON.stringify(mocks.create.mock.calls)).not.toContain("123456");
});
it("an audit store outage must not invite a second delivery", async () => {
  mocks.send.mockResolvedValue({ provider: "fixture", status: "SENT" }); mocks.create.mockRejectedValue(new Error("offline"));
  expect(await sendAuditedEmail(message, "two_factor_code")).toBe(true);
  expect(mocks.send).toHaveBeenCalledOnce();
});
