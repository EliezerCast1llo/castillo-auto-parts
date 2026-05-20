import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  verifyAdminPassword,
  verifyAdminSessionToken,
} from "./admin-session";

describe("admin session helpers", () => {
  const issuedAt = Date.UTC(2026, 4, 19, 12, 0, 0);
  const secret = "admin-secret";

  it("creates and verifies a signed session token", () => {
    const token = createAdminSessionToken(secret, issuedAt);

    expect(verifyAdminSessionToken(token, secret, issuedAt + 1_000)).toBe(true);
  });

  it("rejects tokens signed with another secret", () => {
    const token = createAdminSessionToken(secret, issuedAt);

    expect(verifyAdminSessionToken(token, "other-secret", issuedAt + 1_000)).toBe(false);
  });

  it("rejects malformed and expired tokens", () => {
    const token = createAdminSessionToken(secret, issuedAt);
    const expiredAt = issuedAt + (ADMIN_SESSION_MAX_AGE_SECONDS + 1) * 1_000;

    expect(verifyAdminSessionToken("invalid-token", secret, issuedAt)).toBe(false);
    expect(verifyAdminSessionToken(token, secret, expiredAt)).toBe(false);
  });

  it("compares the admin password exactly", () => {
    expect(verifyAdminPassword("clave-admin", "clave-admin")).toBe(true);
    expect(verifyAdminPassword(" clave-admin", "clave-admin")).toBe(false);
  });
});
