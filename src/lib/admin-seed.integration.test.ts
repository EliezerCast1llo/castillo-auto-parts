import { randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { verifyPassword } from "./admin-credentials";

describe.skipIf(!process.env.DATABASE_URL)("production admin seed CLI", () => {
  const schema = `e2e_admin_seed_${randomUUID().replaceAll("-", "")}`;
  const url = new URL(process.env.DATABASE_URL || "postgresql://localhost/unused");
  url.searchParams.set("schema", schema);
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const valid = { ...process.env, DATABASE_URL: url.toString(), DIRECT_DATABASE_URL: url.toString(), NODE_ENV: "production" as const, SEED_ADMIN_ONLY: "true", ADMIN_SEED_EMAIL: "seed-owner@example.org", ADMIN_SEED_PASSWORD: "private-production-seed-password-101" };
  const run = (changes: Record<string, string>) => spawnSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], { env: { ...valid, ...changes }, encoding: "utf8", timeout: 30_000 });

  beforeAll(() => { execFileSync("npx", ["prisma", "migrate", "deploy"], { env: valid, stdio: "pipe" }); }, 60_000);
  afterAll(async () => { await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await db.$disconnect(); });

  it.each([
    ["ADMIN_SEED_EMAIL", ""], ["ADMIN_SEED_PASSWORD", ""], ["ADMIN_SEED_PASSWORD", "short-password"],
    ["ADMIN_SEED_PASSWORD", "replace-with-a-strong-password"], ["ADMIN_SEED_PASSWORD", "replace-with-a-32-plus-character-random-secret"],
  ])("refuses unsafe %s before creating any admin (%#)", async (name, value) => {
    const result = run({ [name]: value });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(name);
    expect(result.stderr).not.toContain(valid.ADMIN_SEED_PASSWORD);
    expect(result.stderr).not.toContain(url.toString());
    if (value) expect(result.stderr).not.toContain(value);
    expect(await db.user.count()).toBe(0);
    expect(await db.product.count()).toBe(0);
  });

  it("creates a valid admin without any demo catalog and can be rerun", async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      expect(run({}).status).toBe(0);
      expect(await db.user.count()).toBe(1);
      expect(await db.product.count()).toBe(0);
      expect(await db.inventoryLocation.count()).toBe(0);
    }
    const admin = await db.user.findUniqueOrThrow({ where: { email: valid.ADMIN_SEED_EMAIL } });
    expect(admin.role).toBe("ADMIN");
    expect(admin.isActive).toBe(true);
    expect(await verifyPassword(valid.ADMIN_SEED_PASSWORD, admin.passwordHash!)).toBe(true);
  }, 30_000);

  it("refuses a production catalog seed even with valid admin credentials", async () => {
    const result = run({ SEED_ADMIN_ONLY: "" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("SEED_ADMIN_ONLY");
    expect(await db.product.count()).toBe(0);
  });
});
