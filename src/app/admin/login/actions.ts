"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  clearAdminSessionCookie,
  getAdminSecretConfig,
  getSafeAdminNextPath,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { verifyAdminLogin } from "@/lib/admin-user";
import { formString } from "@/lib/form-utils";
import { createAdminLoginRateLimiter } from "@/lib/rate-limit-redis";

const adminLoginRateLimiter = createAdminLoginRateLimiter();

export async function loginAdmin(formData: FormData) {
  const config = getAdminSecretConfig();
  const nextPath = getSafeAdminNextPath(formString(formData, "next"));
  const rateLimitKey = await getAdminLoginRateLimitKey();

  if (!config.isConfigured) {
    redirect(`/admin/login?estado=not_configured&next=${encodeURIComponent(nextPath)}`);
  }

  if (!config.isSafeForRuntime) {
    redirect(`/admin/login?estado=unsafe_config&next=${encodeURIComponent(nextPath)}`);
  }

  const rateLimit = await adminLoginRateLimiter.check(rateLimitKey);
  if (!rateLimit.allowed) {
    redirect(`/admin/login?estado=rate_limited&next=${encodeURIComponent(nextPath)}`);
  }

  const email = formString(formData, "email");
  const password = formString(formData, "password");

  const user = await verifyAdminLogin(email, password);

  if (!user) {
    const failedAttempt = await adminLoginRateLimiter.registerFailure(rateLimitKey);
    const status = failedAttempt.allowed ? "invalid" : "rate_limited";
    redirect(`/admin/login?estado=${status}&next=${encodeURIComponent(nextPath)}`);
  }

  await adminLoginRateLimiter.reset(rateLimitKey);

  // El displayName en el token es el nombre preferido o el email como fallback
  const displayName = user.name?.trim() || user.email;
  await setAdminSessionCookie(user.id, user.role, displayName);

  redirect(nextPath);
}

export async function logoutAdmin() {
  await clearAdminSessionCookie();
  redirect("/admin/login?estado=logged_out");
}

async function getAdminLoginRateLimitKey() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  return `admin-login:${forwardedFor || realIp || "local"}`;
}
