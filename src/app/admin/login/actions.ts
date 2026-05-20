"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  clearAdminSessionCookie,
  getAdminAccessConfig,
  getSafeAdminNextPath,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { verifyAdminPassword } from "@/lib/admin-session";
import { createRateLimiter } from "@/lib/rate-limit";

const adminLoginRateLimiter = createRateLimiter({
  lockoutMs: 15 * 60 * 1000,
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
});

export async function loginAdmin(formData: FormData) {
  const config = getAdminAccessConfig();
  const nextPath = getSafeAdminNextPath(formString(formData, "next"));
  const rateLimitKey = await getAdminLoginRateLimitKey();

  if (!config.isConfigured) {
    redirect(`/admin/login?estado=not_configured&next=${encodeURIComponent(nextPath)}`);
  }

  if (!config.isSafeForRuntime) {
    redirect(`/admin/login?estado=unsafe_config&next=${encodeURIComponent(nextPath)}`);
  }

  const rateLimit = adminLoginRateLimiter.check(rateLimitKey);
  if (!rateLimit.allowed) {
    redirect(`/admin/login?estado=rate_limited&next=${encodeURIComponent(nextPath)}`);
  }

  if (!verifyAdminPassword(formString(formData, "password"), config.password)) {
    const failedAttempt = adminLoginRateLimiter.registerFailure(rateLimitKey);
    const status = failedAttempt.allowed ? "invalid" : "rate_limited";
    redirect(`/admin/login?estado=${status}&next=${encodeURIComponent(nextPath)}`);
  }

  adminLoginRateLimiter.reset(rateLimitKey);
  await setAdminSessionCookie();
  redirect(nextPath);
}

export async function logoutAdmin() {
  await clearAdminSessionCookie();
  redirect("/admin/login?estado=logged_out");
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getAdminLoginRateLimitKey() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  return `admin-login:${forwardedFor || realIp || "local"}`;
}
