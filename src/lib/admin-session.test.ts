import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "./admin-session";

describe("admin session helpers (token v2)", () => {
  const issuedAt = Date.UTC(2026, 4, 19, 12, 0, 0);
  const secret = "admin-secret";
  const userId = "cm1234567890abcdef";
  const role = "ADMIN" as const;
  const displayName = "Ana García";

  it("creates and verifies a signed v2 token", () => {
    const token = createAdminSessionToken(secret, userId, role, displayName, issuedAt);
    const payload = verifyAdminSessionToken(token, secret, issuedAt + 1_000);

    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(userId);
    expect(payload?.role).toBe(role);
    expect(payload?.displayName).toBe(displayName);
  });

  it("rejects tokens signed with another secret", () => {
    const token = createAdminSessionToken(secret, userId, role, displayName, issuedAt);
    expect(verifyAdminSessionToken(token, "other-secret", issuedAt + 1_000)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyAdminSessionToken("invalid-token", secret, issuedAt)).toBeNull();
    expect(verifyAdminSessionToken("v1.123.abc", secret, issuedAt)).toBeNull();
    expect(verifyAdminSessionToken(undefined, secret, issuedAt)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = createAdminSessionToken(secret, userId, role, displayName, issuedAt);
    const expiredAt = issuedAt + (ADMIN_SESSION_MAX_AGE_SECONDS + 1) * 1_000;
    expect(verifyAdminSessionToken(token, secret, expiredAt)).toBeNull();
  });

  it("encodes display names with special characters correctly", () => {
    const nameWithSpecialChars = "María José Ángel";
    const token = createAdminSessionToken(secret, userId, role, nameWithSpecialChars, issuedAt);
    const payload = verifyAdminSessionToken(token, secret, issuedAt + 1_000);
    expect(payload?.displayName).toBe(nameWithSpecialChars);
  });

  it("handles email as display name", () => {
    const email = "user@example.com";
    const token = createAdminSessionToken(secret, userId, role, email, issuedAt);
    const payload = verifyAdminSessionToken(token, secret, issuedAt + 1_000);
    expect(payload?.displayName).toBe(email);
  });
});
