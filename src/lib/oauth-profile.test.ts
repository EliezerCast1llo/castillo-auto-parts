import { describe, expect, it } from "vitest";
import { canSignInWithOAuthProfile, isGoogleEmailVerified } from "@/lib/oauth-profile";

describe("isGoogleEmailVerified", () => {
  it("accepts Google profiles with email_verified true", () => {
    expect(isGoogleEmailVerified({ email: "cliente@example.com", email_verified: true })).toBe(true);
  });

  it("rejects Google profiles when email_verified is not boolean true", () => {
    expect(isGoogleEmailVerified({ email_verified: false })).toBe(false);
    expect(isGoogleEmailVerified({ email_verified: "true" })).toBe(false);
    expect(isGoogleEmailVerified({})).toBe(false);
    expect(isGoogleEmailVerified(null)).toBe(false);
  });
});

describe("canSignInWithOAuthProfile", () => {
  it("rejects Google sign-in when the email is not verified", () => {
    expect(
      canSignInWithOAuthProfile({
        provider: "google",
        profile: { email: "cliente@example.com", email_verified: false },
      }),
    ).toBe(false);
  });

  it("does not change sign-in behavior for non-Google providers", () => {
    expect(canSignInWithOAuthProfile({ provider: "credentials", profile: undefined })).toBe(true);
    expect(canSignInWithOAuthProfile({ provider: null, profile: undefined })).toBe(true);
  });
});
