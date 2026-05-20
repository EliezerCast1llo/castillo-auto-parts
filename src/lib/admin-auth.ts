import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "./admin-session";

export const ADMIN_SESSION_COOKIE = "castillo_admin_session";

export type AdminAccessConfig = {
  issue: "missing" | "weak_password" | "weak_secret" | null;
  isConfigured: boolean;
  isSafeForRuntime: boolean;
  password: string;
  secret: string;
};

const weakAdminPasswords = new Set(["admin", "admin123", "change-me", "password", "12345678"]);
const weakAdminSecrets = new Set(["admin-secret", "change-me", "change-me-secret", "secret"]);

export function getAdminAccessConfig(environment = process.env.NODE_ENV): AdminAccessConfig {
  const password = process.env.ADMIN_ACCESS_PASSWORD?.trim() ?? "";
  const secret = process.env.ADMIN_ACCESS_SECRET?.trim() ?? "";
  const issue = getAdminConfigIssue(password, secret, environment);

  return {
    issue,
    isConfigured: issue !== "missing",
    isSafeForRuntime: issue === null,
    password,
    secret,
  };
}

export async function isAdminAuthenticated() {
  const config = getAdminAccessConfig();
  if (!config.isConfigured || !config.isSafeForRuntime) return false;

  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, config.secret);
}

export async function requireAdminAccess(nextPath = "/admin/orders") {
  if (await isAdminAuthenticated()) return;

  redirect(`/admin/login?next=${encodeURIComponent(getSafeAdminNextPath(nextPath))}`);
}

export async function setAdminSessionCookie() {
  const config = getAdminAccessConfig();
  if (!config.isConfigured || !config.isSafeForRuntime) return false;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(config.secret), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return true;
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function getSafeAdminNextPath(value: string | undefined) {
  const isAdminPath = value === "/admin" || Boolean(value?.startsWith("/admin/"));

  if (!value || !isAdminPath || value.startsWith("/admin/login")) {
    return "/admin/orders";
  }

  return value;
}

export function getAdminConfigIssue(
  password: string,
  secret: string,
  environment = process.env.NODE_ENV,
): AdminAccessConfig["issue"] {
  if (!password || !secret) return "missing";
  if (environment !== "production") return null;
  if (password.length < 12 || weakAdminPasswords.has(password.toLowerCase())) return "weak_password";
  if (secret.length < 32 || weakAdminSecrets.has(secret.toLowerCase())) return "weak_secret";
  return null;
}
