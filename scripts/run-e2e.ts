import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const baseDatabaseUrl = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

if (!baseDatabaseUrl) {
  console.error("Missing DATABASE_URL or E2E_DATABASE_URL for E2E tests.");
  process.exit(1);
}

const schemaName = buildSchemaName(process.env.E2E_DATABASE_SCHEMA);
const isolatedDatabaseUrl = withSchema(baseDatabaseUrl, schemaName);
const baseDatabaseUrlWithoutSchema = withoutSchema(baseDatabaseUrl);
const e2ePort = process.env.E2E_PORT || process.env.PLAYWRIGHT_PORT || "3100";
const e2eBaseUrl = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${e2ePort}`;
const e2eEnv = {
  ...process.env,
  ALLOW_MOCK_PAYMENT_IN_E2E: "true",
  ADMIN_ACCESS_PASSWORD: process.env.E2E_ADMIN_ACCESS_PASSWORD || "e2e-admin-password-for-local-runs",
  ADMIN_ACCESS_SECRET:
    process.env.E2E_ADMIN_ACCESS_SECRET ||
    process.env.ADMIN_ACCESS_SECRET ||
    "e2e-admin-secret-at-least-32-characters-long",
  DATABASE_URL: isolatedDatabaseUrl,
  EMAIL_PROVIDER: process.env.E2E_EMAIL_PROVIDER || "console",
  E2E_ISOLATED_DATABASE: "true",
  GUEST_CART_SECRET:
    process.env.E2E_GUEST_CART_SECRET ||
    process.env.GUEST_CART_SECRET ||
    "e2e-guest-cart-secret-at-least-32-characters-long",
  NEXT_PUBLIC_SITE_URL: process.env.E2E_SITE_URL || e2eBaseUrl,
  PAYMENT_PROVIDER: process.env.E2E_PAYMENT_PROVIDER || "mock",
  PLAYWRIGHT_BASE_URL: e2eBaseUrl,
  PLAYWRIGHT_PORT: e2ePort,
  PLAYWRIGHT_WEB_SERVER_COMMAND: `npm run start -- --port ${e2ePort}`,
};

async function main() {
  let exitCode = 0;

  try {
    console.log(`Preparing isolated E2E database schema "${schemaName}"...`);
    run("npx", ["prisma", "db", "push"], e2eEnv);
    run("npm", ["run", "db:seed"], e2eEnv);
    run("npm", ["run", "build"], e2eEnv);

    const playwrightArgs = process.argv.slice(2);
    run("npx", ["playwright", "test", ...playwrightArgs], e2eEnv);
  } catch (error) {
    exitCode = error instanceof CommandError ? error.exitCode : 1;
    if (!(error instanceof CommandError)) {
      console.error(error);
    }
  } finally {
    try {
      await dropSchema(baseDatabaseUrlWithoutSchema, schemaName);
    } catch (error) {
      exitCode = exitCode || 1;
      console.error(`Failed to drop E2E database schema "${schemaName}".`);
      console.error(error);
    }
  }

  process.exit(exitCode);
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.signal) {
    throw new CommandError(1);
  }

  if (result.status && result.status !== 0) {
    throw new CommandError(result.status);
  }
}

function buildSchemaName(schemaName: string | undefined) {
  const normalizedSchemaName = (schemaName || `e2e_${Date.now()}_${randomUUID().slice(0, 8)}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^([^a-z_])/, "e2e_$1")
    .slice(0, 63)
    .replace(/_$/g, "");
  const safeSchemaName = normalizedSchemaName.startsWith("e2e_")
    ? normalizedSchemaName
    : `e2e_${normalizedSchemaName}`.slice(0, 63).replace(/_$/g, "");

  return safeSchemaName || `e2e_${randomUUID().slice(0, 8)}`;
}

function withSchema(databaseUrl: string, schema: string) {
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", schema);
  return url.toString();
}

function withoutSchema(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.searchParams.delete("schema");
  return url.toString();
}

async function dropSchema(databaseUrl: string, schema: string) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${escapeIdentifier(schema)}" CASCADE`);
    console.log(`Dropped isolated E2E database schema "${schema}".`);
  } finally {
    await prisma.$disconnect();
  }
}

function escapeIdentifier(value: string) {
  return value.replace(/"/g, '""');
}

class CommandError extends Error {
  constructor(readonly exitCode: number) {
    super(`Command failed with exit code ${exitCode}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
