import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const IMPORT_PREVIEW_TTL_MS = 15 * 60 * 1000;
export function csvDigest(source: string) { return createHash("sha256").update(source).digest("hex"); }

export function signImportPreview(input: { source: string; adminId: string; deactivateDemo: boolean; revision: string }, secret: string, now = Date.now()) {
  if (secret.trim().length < 32) throw new Error("ADMIN_ACCESS_SECRET no está configurado para firmar la vista previa.");
  const payload = Buffer.from(JSON.stringify({ version: 1, adminId: input.adminId, hash: csvDigest(input.source), deactivateDemo: input.deactivateDemo, revision: input.revision, expiresAt: now + IMPORT_PREVIEW_TTL_MS })).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export function verifyImportPreview(input: { source: string; adminId: string; deactivateDemo: boolean; proof: string }, secret: string, now = Date.now()): string | null {
  if (secret.trim().length < 32 || input.proof.length > 2048) return null;
  try {
    const [payload, signature, extra] = input.proof.split(".");
    if (!payload || !signature || extra !== undefined) return null;
    const actual = Buffer.from(signature, "base64url");
    const expected = createHmac("sha256", secret).update(payload).digest();
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (parsed.version !== 1 || parsed.adminId !== input.adminId || parsed.hash !== csvDigest(input.source) || parsed.deactivateDemo !== input.deactivateDemo || !Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= now || typeof parsed.revision !== "string") return null;
    return parsed.revision;
  } catch { return null; }
}
