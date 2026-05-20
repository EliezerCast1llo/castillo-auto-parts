import { describe, expect, it } from "vitest";
import { getAdminConfigIssue } from "./admin-auth";

describe("admin access config", () => {
  it("requires password and secret", () => {
    expect(getAdminConfigIssue("", "", "production")).toBe("missing");
  });

  it("allows weak local development credentials", () => {
    expect(getAdminConfigIssue("admin123", "change-me-secret", "development")).toBeNull();
  });

  it("rejects weak production credentials", () => {
    expect(getAdminConfigIssue("admin123", "replace-with-a-32-plus-character-random-secret", "production")).toBe(
      "weak_password",
    );
    expect(getAdminConfigIssue("strong-admin-password", "change-me-secret", "production")).toBe(
      "weak_secret",
    );
  });
});
