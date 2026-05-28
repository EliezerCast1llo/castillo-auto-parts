import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./admin-credentials";

describe("admin password credentials", () => {
  it("hashes and verifies a password correctly", async () => {
    const hash = await hashPassword("mi-contrasena-segura");
    expect(await verifyPassword("mi-contrasena-segura", hash)).toBe(true);
  });

  it("rejects wrong passwords", async () => {
    const hash = await hashPassword("correcta");
    expect(await verifyPassword("incorrecta", hash)).toBe(false);
    expect(await verifyPassword("correcta ", hash)).toBe(false);
  });

  it("generates different hashes for the same password (salts únicos)", async () => {
    const hash1 = await hashPassword("mismo-password");
    const hash2 = await hashPassword("mismo-password");
    expect(hash1).not.toBe(hash2);
    // Pero ambos verifican correctamente
    expect(await verifyPassword("mismo-password", hash1)).toBe(true);
    expect(await verifyPassword("mismo-password", hash2)).toBe(true);
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("password", "sinSeparador")).toBe(false);
    expect(await verifyPassword("password", "")).toBe(false);
  });
}); // scrypt es intencionalmente lento (~200ms por hash)
