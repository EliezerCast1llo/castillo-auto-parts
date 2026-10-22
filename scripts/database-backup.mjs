import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, link, mkdtemp, open, rm, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { pipeline } from "node:stream/promises";

const MAGIC = Buffer.from("CAPBAK01");
const MAX_BYTES = 5 * 1024 ** 3; // Single S3 PUT; fail safely above this bound.
const RETENTION = { daily: 7, weekly: 4, monthly: 3 };

function required(env, name) {
  if (!env[name]?.trim()) throw new Error(`${name}: required`);
  return env[name].trim();
}

export function encryptionKey(env = process.env) {
  const value = required(env, "BACKUP_ENCRYPTION_KEY");
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error("BACKUP_ENCRYPTION_KEY: must be 32 random bytes encoded as 64 hex characters");
  return Buffer.from(value, "hex");
}

export function storageConfig(env = process.env) {
  const endpoint = required(env, "BACKUP_S3_ENDPOINT");
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error();
  } catch { throw new Error("BACKUP_S3_ENDPOINT: must be an HTTPS origin without credentials"); }
  const bucket = required(env, "BACKUP_S3_BUCKET");
  const prefix = required(env, "BACKUP_S3_PREFIX");
  const keyId = required(env, "BACKUP_KEY_ID");
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error("BACKUP_S3_BUCKET: invalid bucket name");
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(prefix)) throw new Error("BACKUP_S3_PREFIX: use slash-separated letters, digits, underscores or hyphens");
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(keyId)) throw new Error("BACKUP_KEY_ID: invalid identifier");
  return { bucket, prefix, keyId, key: encryptionKey(env), client: {
    endpoint, region: required(env, "BACKUP_S3_REGION"), forcePathStyle: true,
    credentials: { accessKeyId: required(env, "BACKUP_S3_ACCESS_KEY_ID"), secretAccessKey: required(env, "BACKUP_S3_SECRET_ACCESS_KEY") },
    maxAttempts: 3, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
    requestHandler: { connectionTimeout: 10_000, requestTimeout: 120_000 },
  } };
}

export function databaseEnvironment(env = process.env) {
  let url;
  try {
    url = new URL(required(env, "BACKUP_DATABASE_URL"));
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2 || url.hash) throw new Error();
    for (const name of url.searchParams.keys()) if (!["sslmode", "sslrootcert", "sslcert", "sslkey"].includes(name)) throw new Error();
    if (!["disable", "require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode"))) throw new Error();
  } catch { throw new Error("BACKUP_DATABASE_URL: use a direct PostgreSQL URL with explicit sslmode (disable only on a trusted private network)"); }
  // Never put a password/URL on argv or inherit unrelated libpq options.
  const childEnv = Object.fromEntries(Object.entries(env).filter(([name]) => !name.startsWith("PG") && !name.startsWith("BACKUP_")));
  try {
    return { ...childEnv, PGHOST: url.hostname, PGPORT: url.port || "5432", PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
      PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGCONNECT_TIMEOUT: "10",
      PGSSLMODE: url.searchParams.get("sslmode"), PGSSLROOTCERT: url.searchParams.get("sslrootcert") || "",
      PGSSLCERT: url.searchParams.get("sslcert") || "", PGSSLKEY: url.searchParams.get("sslkey") || "",
    };
  } catch { throw new Error("BACKUP_DATABASE_URL: invalid encoding"); }
}

export function runPostgres(command, args, env) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "ignore", "pipe"], timeout: 600_000 });
    child.stderr?.resume(); // Discard provider output: it may include connection data.
    child.on("error", () => reject(new Error(`${command} could not start`)));
    child.on("close", (code) => code === 0 ? accept() : reject(new Error(`${command} failed; check connectivity and PostgreSQL version (database output withheld)`)));
  });
}

export async function encryptDump(source, destination, key) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(MAGIC);
  await writeFile(destination, Buffer.concat([MAGIC, nonce]), { flag: "wx", mode: 0o600 });
  await pipeline(createReadStream(source), cipher, createWriteStream(destination, { flags: "a", mode: 0o600 }));
  await appendFile(destination, cipher.getAuthTag());
}

export async function decryptDump(source, destination, key) {
  const handle = await open(source, "r");
  const temporary = `${destination}.${randomUUID()}.partial`;
  try {
    const size = (await handle.stat()).size;
    if (size < 36 || size > MAX_BYTES) throw new Error("Invalid encrypted backup size");
    const header = Buffer.alloc(20), tag = Buffer.alloc(16);
    await handle.read(header, 0, 20, 0);
    await handle.read(tag, 0, 16, size - 16);
    if (!header.subarray(0, 8).equals(MAGIC)) throw new Error("Unsupported backup format");
    const decipher = createDecipheriv("aes-256-gcm", key, header.subarray(8));
    decipher.setAAD(MAGIC);
    decipher.setAuthTag(tag);
    await pipeline(createReadStream(source, { start: 20, end: size - 17 }), decipher, createWriteStream(temporary, { flags: "wx", mode: 0o600 }));
    // Publish only authenticated plaintext, never overwrite an existing dump.
    await link(temporary, destination);
  } finally {
    await handle.close();
    await rm(temporary, { force: true });
  }
}

async function digestFile(path, algorithm) {
  const hash = createHash(algorithm);
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest(algorithm === "md5" ? "base64" : "hex");
}

export function scheduledKeys(prefix, now, manual = false) {
  const day = now.toISOString().slice(0, 10);
  if (manual) return [`${prefix}/manual/${now.toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.dump.enc`];
  return [`${prefix}/daily/${day}.dump.enc`,
    ...(now.getUTCDay() === 0 ? [`${prefix}/weekly/${day}.dump.enc`] : []),
    ...(now.getUTCDate() === 1 ? [`${prefix}/monthly/${day}.dump.enc`] : []),
  ];
}

export function retentionDeletions(keys, prefix, now) {
  const today = now.toISOString().slice(0, 10);
  const remove = [];
  for (const [period, keep] of Object.entries(RETENTION)) {
    const start = `${prefix}/${period}/`;
    const owned = [...new Set(keys)].filter((key) => {
      if (!key.startsWith(start)) return false;
      const filename = key.slice(start.length);
      if (!/^\d{4}-\d{2}-\d{2}\.dump\.enc$/.test(filename)) return false;
      const day = filename.slice(0, 10), date = new Date(`${day}T00:00:00Z`);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day || day > today) return false;
      return period === "daily" || (period === "weekly" ? date.getUTCDay() === 0 : date.getUTCDate() === 1);
    }).sort().reverse();
    remove.push(...owned.slice(keep));
  }
  return remove;
}

export async function createBackup({ config, databaseEnv, client, now = new Date(), manual = false, run = runPostgres }) {
  const directory = await mkdtemp(join(tmpdir(), "castillo-backup-"));
  try {
    const dump = join(directory, "database.dump"), encrypted = join(directory, "database.dump.enc");
    await run("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--lock-wait-timeout=30s", `--file=${dump}`], databaseEnv);
    await run("pg_restore", ["--list", dump], databaseEnv);
    await encryptDump(dump, encrypted, config.key);
    const bytes = (await stat(encrypted)).size;
    if (bytes > MAX_BYTES) throw new Error("Backup exceeds the 5 GiB single-upload limit; use a reviewed multipart solution");
    const sha256 = await digestFile(encrypted, "sha256"), md5 = await digestFile(encrypted, "md5");
    const keys = scheduledKeys(config.prefix, now, manual);
    for (const key of keys) {
      const body = createReadStream(encrypted);
      try {
        await client.send(new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: body, ContentLength: bytes,
          ContentMD5: md5, ContentType: "application/octet-stream", Metadata: { sha256, keyid: config.keyId, format: "CAPBAK01" } }));
      } finally { body.destroy(); }
      const head = await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
      if (head.ContentLength !== bytes || head.Metadata?.sha256 !== sha256 || head.Metadata?.keyid !== config.keyId) throw new Error("Uploaded backup verification failed; retention skipped");
    }
    // No deletion until every scheduled copy has been uploaded and verified.
    const existing = [];
    if (!manual) for (const period of Object.keys(RETENTION)) {
      let token;
      do {
        const page = await client.send(new ListObjectsV2Command({ Bucket: config.bucket, Prefix: `${config.prefix}/${period}/`, ContinuationToken: token }));
        existing.push(...(page.Contents || []).map((object) => object.Key).filter(Boolean));
        if (page.IsTruncated && (!page.NextContinuationToken || page.NextContinuationToken === token)) throw new Error("Incomplete retention listing; cleanup aborted");
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
    }
    const expired = retentionDeletions(existing, config.prefix, now);
    for (const key of expired) await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    return { keys, bytes, sha256, deleted: expired.length, keyId: config.keyId };
  } finally { await rm(directory, { recursive: true, force: true }); }
}

export async function downloadBackup({ config, client, key, destination }) {
  if (!key.startsWith(`${config.prefix}/`) || !key.endsWith(".dump.enc")) throw new Error("Choose a backup key within BACKUP_S3_PREFIX");
  const directory = await mkdtemp(join(tmpdir(), "castillo-restore-"));
  try {
    const file = join(directory, "backup.enc");
    const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
    if (!response.ContentLength || response.ContentLength > MAX_BYTES || response.Metadata?.keyid !== config.keyId || !/^[a-f0-9]{64}$/.test(response.Metadata?.sha256 || "")) throw new Error("Backup metadata/key identifier mismatch");
    await pipeline(response.Body, createWriteStream(file, { flags: "wx", mode: 0o600 }));
    if ((await stat(file)).size !== response.ContentLength || await digestFile(file, "sha256") !== response.Metadata.sha256) throw new Error("Backup checksum mismatch");
    await decryptDump(file, destination, config.key);
    return { sha256: response.Metadata.sha256, keyId: config.keyId };
  } finally { await rm(directory, { recursive: true, force: true }); }
}

export async function main(args = process.argv.slice(2), env = process.env) {
  // Errors from SDK/libpq must never reach logs with credentials or data.
  const operation = args[0];
  if (operation === "decrypt" && args.length === 3) {
    await decryptDump(resolve(args[1]), resolve(args[2]), encryptionKey(env));
    console.log("Backup authenticated and decrypted; restore into an empty isolated database.");
    return;
  }
  if (!((operation === "backup" && (args.length === 1 || args[1] === "--manual" && args.length === 2)) || (operation === "download" && args.length === 3))) throw new Error("Usage: backup [--manual] | download <object-key> <new-dump-path> | decrypt <encrypted-path> <new-dump-path>");
  const config = storageConfig(env), client = new S3Client(config.client);
  try {
    const result = operation === "backup"
      ? await createBackup({ config, databaseEnv: databaseEnvironment(env), client, manual: args[1] === "--manual" })
      : await downloadBackup({ config, client, key: args[1], destination: resolve(args[2]) });
    console.log(JSON.stringify({ operation, ...result }));
  } finally { client.destroy(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => {
    console.error("Database backup command failed. Check required BACKUP_* variables, storage access, disk space and PostgreSQL client/server versions. No provider output is logged.");
    process.exitCode = 1;
  });
}
