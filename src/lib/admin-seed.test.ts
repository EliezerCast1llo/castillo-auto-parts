import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readAdminSeedCredentials } from "./admin-seed";

const valid = { NODE_ENV: "production", SEED_ADMIN_ONLY: "true", ADMIN_SEED_EMAIL: "owner@example.org", ADMIN_SEED_PASSWORD: "private-seed-test-password-2026" };

describe("production admin seed credentials", () => {
  it.each(["ADMIN_SEED_EMAIL", "ADMIN_SEED_PASSWORD"] as const)("rejects missing %s without exposing credentials", (name) => {
    expect(() => readAdminSeedCredentials({ ...valid, [name]: "" })).toThrow(name);
    try { readAdminSeedCredentials({ ...valid, [name]: "" }); }
    catch (error) { expect(String(error)).not.toContain(valid.ADMIN_SEED_PASSWORD); }
  });
  it.each(["short", "123456789012345", "   ", "replace-with-a-strong-password", "replace-with-a-32-plus-character-random-secret"])("rejects an unsafe password (%#)", (password) => {
    expect(() => readAdminSeedCredentials({ ...valid, ADMIN_SEED_PASSWORD: password })).toThrow("ADMIN_SEED_PASSWORD");
  });
  it("rejects every nonempty value from the public environment template", () => {
    const values = [...readFileSync(".env.example", "utf8").matchAll(/^\w+="([^"]+)"/gm)].map((match) => match[1]);
    for (const password of values) expect(() => readAdminSeedCredentials({ ...valid, ADMIN_SEED_PASSWORD: password })).toThrow("ADMIN_SEED_PASSWORD");
  });
  it("accepts a valid credential and the exact 16-character boundary", () => {
    expect(readAdminSeedCredentials(valid)).toEqual({ email: valid.ADMIN_SEED_EMAIL, password: valid.ADMIN_SEED_PASSWORD });
    expect(readAdminSeedCredentials({ ...valid, ADMIN_SEED_PASSWORD: "valid-boundary16" })).toBeTruthy();
  });
  it.each(["invalid", "admin@tudominio.com"])("rejects invalid/example emails (%#)", (email) => {
    expect(() => readAdminSeedCredentials({ ...valid, ADMIN_SEED_EMAIL: email })).toThrow("ADMIN_SEED_EMAIL");
  });
  it("keeps the optional local seed behavior", () => {
    expect(readAdminSeedCredentials({ NODE_ENV: "development" })).toBeNull();
  });
});
