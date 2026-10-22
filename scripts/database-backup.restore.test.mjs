import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { createBackup, databaseEnvironment, downloadBackup } from "./database-backup.mjs";

test("PostgreSQL 16 dump → encrypted upload → verified download → pg_restore preserves data and constraints", { skip: !process.env.BACKUP_INTEGRATION_DATABASE_URL, timeout: 120_000 }, async () => {
  const id = randomUUID().replaceAll("-", ""), source = `backup_test_src_${id}`, target = `backup_test_dst_${id}`;
  const env = databaseEnvironment({ ...process.env, BACKUP_DATABASE_URL: process.env.BACKUP_INTEGRATION_DATABASE_URL });
  const sql = (database, query) => execFileSync("psql", ["--no-psqlrc", "--tuples-only", "--no-align", "--set=ON_ERROR_STOP=1", "--command", query], { env: { ...env, PGDATABASE: database }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const directory = await mkdtemp(join(tmpdir(), "backup-restore-proof-"));
  const stored = new Map();
  const client = { async send(command) {
    const input = command.input;
    switch (command.constructor.name) {
      case "PutObjectCommand": {
        const chunks = [];
        for await (const chunk of input.Body) chunks.push(chunk);
        stored.set(input.Key, { bytes: Buffer.concat(chunks), metadata: input.Metadata });
        return {};
      }
      case "HeadObjectCommand": return { ContentLength: stored.get(input.Key).bytes.length, Metadata: stored.get(input.Key).metadata };
      case "ListObjectsV2Command": return { Contents: [], IsTruncated: false };
      case "GetObjectCommand": return { Body: Readable.from([stored.get(input.Key).bytes]), ContentLength: stored.get(input.Key).bytes.length, Metadata: stored.get(input.Key).metadata };
      default: throw new Error("Unexpected storage action");
    }
  } };
  try {
    sql(env.PGDATABASE, `CREATE DATABASE ${source}`);
    sql(env.PGDATABASE, `CREATE DATABASE ${target}`);
    sql(source, `CREATE TABLE customers (id integer PRIMARY KEY, name text NOT NULL);
      CREATE TABLE orders (id integer PRIMARY KEY, customer_id integer REFERENCES customers(id), total numeric(10,2));
      CREATE TABLE stock (sku text PRIMARY KEY, on_hand integer CHECK(on_hand >= 0), reserved integer CHECK(reserved >= 0));
      INSERT INTO customers VALUES (1, 'Cliente José 東京'); INSERT INTO orders VALUES (42, 1, 125.50);
      INSERT INTO stock VALUES ('PART-101', 10, 3);`);
    const config = { bucket: "test-backups", prefix: "restore-proof", key: Buffer.alloc(32, 23), keyId: "test-key" };
    const result = await createBackup({ config, client, databaseEnv: { ...env, PGDATABASE: source } });
    const destination = join(directory, "database.dump");
    await downloadBackup({ config, client, key: result.keys[0], destination });
    execFileSync("pg_restore", ["--dbname", target, "--exit-on-error", "--no-owner", "--no-privileges", destination], { env, stdio: "pipe" });
    for (const query of ["SELECT * FROM customers ORDER BY id", "SELECT * FROM orders ORDER BY id", "SELECT * FROM stock ORDER BY sku"]) {
      assert.equal(sql(target, query), sql(source, query));
    }
    assert.throws(() => sql(target, "INSERT INTO orders VALUES (99, 999, 1.00)"));
    assert.throws(() => sql(target, "INSERT INTO stock VALUES ('BAD', -1, 0)"));
    assert.equal(stored.get(result.keys[0]).bytes.includes(Buffer.from("Cliente José")), false);
    console.log(JSON.stringify({ proof: "restore", tables: 3, rows: 3, foreignKeyAndCheckConstraints: "preserved", encryptedBytes: result.bytes }));
  } finally {
    sql(env.PGDATABASE, `DROP DATABASE IF EXISTS ${source} WITH (FORCE)`);
    sql(env.PGDATABASE, `DROP DATABASE IF EXISTS ${target} WITH (FORCE)`);
    await rm(directory, { recursive: true, force: true });
  }
});
