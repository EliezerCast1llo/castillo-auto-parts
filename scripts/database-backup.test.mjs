import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { spawnSync } from "node:child_process";
import { createBackup, databaseEnvironment, decryptDump, downloadBackup, encryptionKey, encryptDump, retentionDeletions, scheduledKeys, storageConfig } from "./database-backup.mjs";

const env = { BACKUP_DATABASE_URL: "postgresql://fixture:private-password@localhost:5432/fixture?sslmode=disable", BACKUP_S3_ENDPOINT: "https://s3.example.org", BACKUP_S3_REGION: "auto", BACKUP_S3_BUCKET: "private-backups", BACKUP_S3_PREFIX: "castillo/postgres", BACKUP_S3_ACCESS_KEY_ID: "fixture-access", BACKUP_S3_SECRET_ACCESS_KEY: "fixture-secret", BACKUP_ENCRYPTION_KEY: "a1".repeat(32), BACKUP_KEY_ID: "key-2026" };
const config = storageConfig(env);
const bytes = Buffer.from("PGDMP fixture with orders, inventory and private customer data");

export class MemoryStorage {
  objects = new Map();
  calls = [];
  fail;
  async send(command) {
    const operation = command.constructor.name, input = command.input;
    this.calls.push({ operation, input });
    if (this.fail?.(operation, input)) throw new Error("private-provider-error-with-credentials");
    if (operation === "PutObjectCommand") {
      const parts = [];
      for await (const part of input.Body) parts.push(part);
      this.objects.set(input.Key, { body: Buffer.concat(parts), metadata: input.Metadata });
      return {};
    }
    const object = this.objects.get(input.Key);
    if (operation === "HeadObjectCommand") return { ContentLength: object.body.length, Metadata: object.metadata };
    if (operation === "GetObjectCommand") return { Body: Readable.from([object.body]), ContentLength: object.body.length, Metadata: object.metadata };
    if (operation === "DeleteObjectCommand") { this.objects.delete(input.Key); return {}; }
    if (operation === "ListObjectsV2Command") {
      const keys = [...this.objects.keys()].filter((key) => key.startsWith(input.Prefix)).sort();
      const start = Number(input.ContinuationToken || 0), page = keys.slice(start, start + 2);
      return { Contents: page.map((Key) => ({ Key })), IsTruncated: start + 2 < keys.length, NextContinuationToken: String(start + 2) };
    }
    throw new Error("Unexpected storage operation");
  }
}

async function temporary(t) {
  const directory = await mkdtemp(join(tmpdir(), "backup-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}
const fakeDump = async (command, args) => {
  if (command === "pg_dump") await writeFile(args.find((arg) => arg.startsWith("--file=")).slice(7), bytes);
};

test("validates required backup settings, HTTPS, key format, path and isolated credentials", () => {
  for (const name of Object.keys(env).filter((name) => name !== "BACKUP_DATABASE_URL")) {
    assert.throws(() => storageConfig({ ...env, [name]: "" }), new RegExp(name));
  }
  for (const endpoint of ["http://s3.example.org", "https://user:password@s3.example.org", "https://s3.example.org/path", "https://s3.example.org?token=secret"]) {
    assert.throws(() => storageConfig({ ...env, BACKUP_S3_ENDPOINT: endpoint }), /BACKUP_S3_ENDPOINT/);
  }
  assert.throws(() => storageConfig({ ...env, BACKUP_S3_PREFIX: "../other" }), /BACKUP_S3_PREFIX/);
  assert.throws(() => encryptionKey({ BACKUP_ENCRYPTION_KEY: "replace-with-a-password" }), /BACKUP_ENCRYPTION_KEY/);
});

test("passes database credentials only via libpq environment and rejects Prisma/pooler options", () => {
  const pg = databaseEnvironment({ ...env, PGOPTIONS: "unexpected inherited option" });
  assert.equal(pg.PGPASSWORD, "private-password");
  assert.equal(pg.PGOPTIONS, undefined);
  assert.equal(pg.BACKUP_ENCRYPTION_KEY, undefined);
  assert.equal(pg.PGDATABASE, "fixture");
  for (const url of ["bad", "postgresql://user:secret@host/db?schema=public", "postgresql://host/db", "postgresql://host/db?sslmode=prefer"]) {
    assert.throws(() => databaseEnvironment({ ...env, BACKUP_DATABASE_URL: url }), /BACKUP_DATABASE_URL/);
  }
});

test("authenticated encryption roundtrip, random nonce, corruption/wrong-key rejection and no overwrite", async (t) => {
  const dir = await temporary(t), input = join(dir, "plain.dump"), a = join(dir, "a.enc"), b = join(dir, "b.enc"), output = join(dir, "restored.dump");
  await writeFile(input, bytes);
  await encryptDump(input, a, config.key);
  await encryptDump(input, b, config.key);
  assert.notDeepEqual(await readFile(a), await readFile(b));
  assert.equal((await stat(a)).mode & 0o777, 0o600);
  await decryptDump(a, output, config.key);
  assert.deepEqual(await readFile(output), bytes);
  await assert.rejects(decryptDump(a, output, config.key));
  await assert.rejects(decryptDump(a, join(dir, "wrong.dump"), Buffer.alloc(32)));
  const corrupted = await readFile(a); corrupted[25] ^= 1; await writeFile(a, corrupted);
  await assert.rejects(decryptDump(a, join(dir, "corrupt.dump"), config.key));
  assert.equal((await readdir(dir)).some((name) => name.includes("partial") || name === "wrong.dump" || name === "corrupt.dump"), false);
  assert.deepEqual(await readFile(output), bytes);
});

test("uses daily, Sunday weekly, first-day monthly and unpruned manual keys in UTC", () => {
  assert.equal(scheduledKeys(config.prefix, new Date("2026-11-01T08:00:00Z")).length, 3);
  assert.equal(scheduledKeys(config.prefix, new Date("2026-11-02T08:00:00Z")).length, 1);
  assert.match(scheduledKeys(config.prefix, new Date(), true)[0], /\/manual\//);
});

test("7/4/3 retention keeps distinct dates and ignores manual, malformed, future and other prefixes", () => {
  const prefix = config.prefix;
  const daily = Array.from({ length: 10 }, (_, i) => `${prefix}/daily/2026-10-${String(i + 1).padStart(2, "0")}.dump.enc`);
  const weekly = ["08-30", "09-06", "09-13", "09-20", "09-27", "10-04"].map((day) => `${prefix}/weekly/2026-${day}.dump.enc`);
  const monthly = ["05", "06", "07", "08", "09"].map((month) => `${prefix}/monthly/2026-${month}-01.dump.enc`);
  const ignored = [`other/daily/2020-01-01.dump.enc`, `${prefix}/manual/2020-01-01.dump.enc`, `${prefix}/daily/2099-01-01.dump.enc`, `${prefix}/monthly/2026-08-05.dump.enc`, `${prefix}/daily/2026-02-31.dump.enc`];
  const removed = retentionDeletions([...daily, ...weekly, ...monthly, ...ignored, daily[0]], prefix, new Date("2026-10-22T08:00:00Z"));
  assert.deepEqual(new Set(removed), new Set([...daily.slice(0, 3), ...weekly.slice(0, 2), ...monthly.slice(0, 2)]));
  assert.equal(removed.some((key) => ignored.includes(key)), false);
  assert.deepEqual(retentionDeletions(daily.slice(0, 2), prefix, new Date()), []);
});

test("uploads only encrypted data, verifies each copy, paginates retention and downloads authenticated plaintext", async (t) => {
  const dir = await temporary(t), client = new MemoryStorage();
  for (let day = 1; day <= 10; day++) client.objects.set(`${config.prefix}/daily/2026-10-${String(day).padStart(2, "0")}.dump.enc`, { body: Buffer.alloc(1) });
  const result = await createBackup({ config, databaseEnv: databaseEnvironment(env), client, now: new Date("2026-11-01T08:00:00Z"), run: fakeDump });
  assert.equal(result.keys.length, 3);
  assert.equal(result.deleted, 4);
  assert.equal([...client.objects.keys()].filter((key) => key.includes("/daily/")).length, 7);
  assert.equal(client.objects.get(result.keys[0]).body.includes(bytes), false);
  const destination = join(dir, "restore.dump");
  await downloadBackup({ config, client, key: result.keys[0], destination });
  assert.deepEqual(await readFile(destination), bytes);
  const firstDelete = client.calls.findIndex((call) => call.operation === "DeleteObjectCommand");
  assert.equal(client.calls.slice(0, firstDelete).filter((call) => call.operation === "HeadObjectCommand").length, 3);
  assert.ok(client.calls.some((call) => call.input.ContinuationToken));
});

test("dump, archive validation, partial upload and verification failures never delete backups", async () => {
  for (const failure of ["pg_dump", "pg_restore", "PutObjectCommand", "HeadObjectCommand"]) {
    const client = new MemoryStorage();
    client.fail = (operation, input) => operation === failure && (failure !== "PutObjectCommand" || input.Key.includes("weekly"));
    await assert.rejects(createBackup({ config, client, databaseEnv: databaseEnvironment(env), now: new Date("2026-11-01T08:00:00Z"), run: async (command, args) => {
      if (command === failure) throw new Error("fixture failure");
      await fakeDump(command, args);
    } }));
    assert.equal(client.calls.some((call) => call.operation === "DeleteObjectCommand"), false);
  }
});

test("manual backups skip retention and corrupt downloads never create an output dump", async (t) => {
  const client = new MemoryStorage(), dir = await temporary(t);
  const result = await createBackup({ config, client, databaseEnv: databaseEnvironment(env), manual: true, run: fakeDump });
  assert.equal(client.calls.some((call) => call.operation === "ListObjectsV2Command"), false);
  client.objects.get(result.keys[0]).body[25] ^= 1;
  await assert.rejects(downloadBackup({ config, client, key: result.keys[0], destination: join(dir, "invalid.dump") }), /checksum/);
  assert.deepEqual(await readdir(dir), []);
});

test("CLI exits nonzero without printing secrets or provider error bodies", () => {
  const result = spawnSync(process.execPath, ["scripts/database-backup.mjs", "backup"], { env: { ...process.env, ...env, BACKUP_S3_ENDPOINT: "https://private-user:private-password@private-host" }, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /BACKUP_\*/);
  for (const secret of ["private-user", "private-password", "private-host", env.BACKUP_S3_SECRET_ACCESS_KEY, env.BACKUP_ENCRYPTION_KEY]) assert.equal(result.stderr.includes(secret), false);
});
