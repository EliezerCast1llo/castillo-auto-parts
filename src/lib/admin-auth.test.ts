import { describe, expect, it } from "vitest";
import { getAdminSecretIssue } from "./admin-auth";

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
