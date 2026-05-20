import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/admin-session";

export const ADMIN_SESSION_COOKIE = "castillo_admin_session";

export type AdminAccessConfig = {
  isConfigured: boolean;
  password: string;
  secret: string;
};

export function getAdminAccessConfig(): AdminAccessConfig {
  const password = process.env.ADMIN_ACCESS_PASSWORD?.trim() ?? "";
  const secret = process.env.ADMIN_ACCESS_SECRET?.trim() ?? "";

  return {
    isConfigured: Boolean(password && secret),
    password,
    secret,
  };
}

export async function isAdminAuthenticated() {
  const config = getAdminAccessConfig();
  if (!config.isConfigured) return false;

  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, config.secret);
}

export async function requireAdminAccess(nextPath = "/admin/orders") {
  if (await isAdminAuthenticated()) return;

  redirect(`/admin/login?next=${encodeURIComponent(getSafeAdminNextPath(nextPath))}`);
}

export async function setAdminSessionCookie() {
  const config = getAdminAccessConfig();
  if (!config.isConfigured) return false;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(config.secret), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
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
