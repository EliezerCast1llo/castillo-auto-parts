import "server-only";
import { OperationalError } from "../operational-error";
import { z } from "zod";
import { db } from "../db";
import { boxfulConfig, boxfulError } from "./config";
import { seal, unseal } from "./crypto";

const pairSchema = z.object({ accessToken: z.string().min(1), refreshToken: z.string().min(1), accessTokenExpiresAt: z.number().finite(), refreshTokenExpiresAt: z.number().finite() });
export class BoxfulHttpError extends OperationalError {
  constructor(readonly status: number) { super(status >= 500 ? "PROVIDER_UNAVAILABLE" : "PROVIDER_REJECTED", "Boxful request failed."); }
}
export async function boxfulHttp(path: string, body?: unknown, token?: string) {
  const config = boxfulConfig();
  try {
    const response = await fetch(new URL(path, config.baseUrl), {
      method: body === undefined ? "GET" : "POST", cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new BoxfulHttpError(response.status);
    return await response.json() as unknown;
  } catch (error) {
    if (error instanceof BoxfulHttpError) throw error;
    throw boxfulError("PROVIDER_UNAVAILABLE");
  }
}

export async function boxfulAccessToken() {
  const config = boxfulConfig();
  // INSERT ON CONFLICT is committed before locking; an empty Prisma upsert can
  // fall back to read-then-create and race on the first request.
  await db.boxfulSession.createMany({ data: { id: config.scope }, skipDuplicates: true });
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "BoxfulSession" WHERE id = ${config.scope} FOR UPDATE`;
    const row = await tx.boxfulSession.findUniqueOrThrow({ where: { id: config.scope } });
    const purpose = `boxful:${config.scope}`;
    const saved = row.encryptedTokens ? pairSchema.parse(unseal(row.encryptedTokens, "BOXFUL_TOKEN_ENCRYPTION_KEY", purpose)) : null;
    const now = Date.now() / 1000;
    if (saved && saved.accessTokenExpiresAt > now + 60) return saved.accessToken;
    let data: unknown;
    if (saved && saved.refreshTokenExpiresAt > now + 60) {
      try { data = await boxfulHttp("/auth/v2/refresh", { refreshToken: saved.refreshToken }); }
      catch (error) {
        if (!(error instanceof BoxfulHttpError) || error.status !== 401) throw error;
      }
    }
    if (!data) data = await boxfulHttp("/auth/v2/client", { email: config.email, password: config.password });
    const parsed = pairSchema.safeParse(data);
    if (!parsed.success || parsed.data.accessTokenExpiresAt <= now || parsed.data.refreshTokenExpiresAt <= now) throw boxfulError("PROVIDER_REJECTED");
    await tx.boxfulSession.update({ where: { id: config.scope }, data: { encryptedTokens: seal(parsed.data, "BOXFUL_TOKEN_ENCRYPTION_KEY", purpose) } });
    return parsed.data.accessToken;
  }, { maxWait: 15000, timeout: 20000 });
}
export async function boxfulRequest(path: string, body?: unknown) {
  return boxfulHttp(path, body, await boxfulAccessToken());
}
