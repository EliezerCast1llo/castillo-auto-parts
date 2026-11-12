import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), challenge: vi.fn(), send: vi.fn(), cookie: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.user } } }));
vi.mock("@/lib/two-factor", () => ({ createTwoFactorChallenge: mocks.challenge, TWO_FACTOR_LIMITS: { ttlMs: 600000 } }));
vi.mock("@/lib/two-factor-cookie", () => ({ setPendingTwoFactorCookie: mocks.cookie }));
vi.mock("@/lib/email/audited-delivery", () => ({ sendAuditedEmail: mocks.send }));
import { deliverTwoFactorChallenge } from "./two-factor-delivery";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ isActive: true, twoFactorEnabled: true, email: "fixture@example.com", name: "QA" });
  mocks.challenge.mockResolvedValue({ challengeId: "challenge", code: "123456" });
});
it("uses audited delivery before setting the pending cookie", async () => {
  mocks.send.mockResolvedValue(true);
  expect(await deliverTwoFactorChallenge("user", "es", "customer")).toBe("sent");
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "fixture@example.com" }), "two_factor_code");
  expect(mocks.cookie).toHaveBeenCalledWith("customer", { challengeId: "challenge", userId: "user" });
});
it("does not set a cookie when delivery fails", async () => {
  mocks.send.mockResolvedValue(false);
  expect(await deliverTwoFactorChallenge("user", "es", "admin")).toBe("unavailable");
  expect(mocks.cookie).not.toHaveBeenCalled();
});
it("does not send a challenge to an inactive user", async () => {
  mocks.user.mockResolvedValue({ isActive: false });
  expect(await deliverTwoFactorChallenge("user", "es", "admin")).toBe("unavailable");
  expect(mocks.send).not.toHaveBeenCalled();
});
