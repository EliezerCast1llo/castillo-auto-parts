import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getAdminSecretIssue, getAdminUserForHandler, ADMIN_SESSION_COOKIE } from "./admin-auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
  },
}));

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createAdminSessionToken } from "./admin-session";

describe("admin secret config", () => {
  it("requires secret", () => {
    expect(getAdminSecretIssue("", "production")).toBe("missing");
    expect(getAdminSecretIssue("", "development")).toBe("missing");
  });

  it("allows short secret in development", () => {
    expect(getAdminSecretIssue("short", "development")).toBeNull();
  });

  it("rejects weak production secrets", () => {
    expect(getAdminSecretIssue("change-me-secret", "production")).toBe("weak_secret");
    expect(getAdminSecretIssue("short", "production")).toBe("weak_secret");
  });

  it("accepts strong production secret", () => {
    expect(
      getAdminSecretIssue("a-very-long-and-random-secret-32-chars!!", "production"),
    ).toBeNull();
  });
});

describe("getAdminUserForHandler", () => {
  const TEST_SECRET = "test-admin-secret-long-enough-for-vitest-ok";
  const TEST_USER_ID = "cm1234567890abcdef";

  function makeToken(role: string) {
    return createAdminSessionToken(
      TEST_SECRET,
      TEST_USER_ID,
      role as never,
      `${role.toLowerCase()}@test.com`,
    );
  }

  function mockCookieStore(tokenValue: string | undefined) {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === ADMIN_SESSION_COOKIE && tokenValue !== undefined
          ? { name, value: tokenValue }
          : undefined,
    } as never);
  }

  beforeEach(() => {
    vi.stubEnv("ADMIN_ACCESS_SECRET", TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 when no cookie is present", async () => {
    mockCookieStore(undefined);
    const result = await getAdminUserForHandler("ADMIN", "MARKETING");
    expect("response" in result).toBe(true);
    if ("response" in result) expect(result.response.status).toBe(401);
  });

  it("returns 401 for an invalid/tampered token", async () => {
    mockCookieStore("v2.invalid.token.here.boom.sig");
    const result = await getAdminUserForHandler("ADMIN", "MARKETING");
    expect("response" in result).toBe(true);
    if ("response" in result) expect(result.response.status).toBe(401);
  });

  it("returns 401 when the user is not found in DB (deleted after token issued)", async () => {
    mockCookieStore(makeToken("ADMIN"));
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const result = await getAdminUserForHandler("ADMIN", "MARKETING");
    expect("response" in result).toBe(true);
    if ("response" in result) expect(result.response.status).toBe(401);
  });

  it("returns 401 when the user is inactive (deactivated after token issued)", async () => {
    mockCookieStore(makeToken("ADMIN"));
    vi.mocked(db.user.findUnique).mockResolvedValue({ isActive: false, role: "ADMIN" } as never);
    const result = await getAdminUserForHandler("ADMIN", "MARKETING");
    expect("response" in result).toBe(true);
    if ("response" in result) expect(result.response.status).toBe(401);
  });

  it.each(["SALES", "SUPPORT", "WAREHOUSE", "ACCOUNTING"] as const)(
    "returns 403 for role %s",
    async (role) => {
      mockCookieStore(makeToken(role));
      vi.mocked(db.user.findUnique).mockResolvedValue({ isActive: true, role } as never);
      const result = await getAdminUserForHandler("ADMIN", "MARKETING");
      expect("response" in result).toBe(true);
      if ("response" in result) expect(result.response.status).toBe(403);
    },
  );

  it.each(["ADMIN", "MARKETING"] as const)(
    "returns the user for role %s",
    async (role) => {
      mockCookieStore(makeToken(role));
      vi.mocked(db.user.findUnique).mockResolvedValue({ isActive: true, role } as never);
      const result = await getAdminUserForHandler("ADMIN", "MARKETING");
      expect("user" in result).toBe(true);
      if ("user" in result) expect(result.user.role).toBe(role);
    },
  );

  it("returns the fresh DB role even if token has a stale role", async () => {
    // Token says SALES but DB now says ADMIN (role was upgraded)
    mockCookieStore(makeToken("SALES"));
    vi.mocked(db.user.findUnique).mockResolvedValue({ isActive: true, role: "ADMIN" } as never);
    const result = await getAdminUserForHandler("ADMIN");
    expect("user" in result).toBe(true);
    if ("user" in result) expect(result.user.role).toBe("ADMIN");
  });

  it("allows any authenticated role when no restrictions are specified", async () => {
    mockCookieStore(makeToken("SALES"));
    vi.mocked(db.user.findUnique).mockResolvedValue({ isActive: true, role: "SALES" } as never);
    const result = await getAdminUserForHandler();
    expect("user" in result).toBe(true);
  });
});
