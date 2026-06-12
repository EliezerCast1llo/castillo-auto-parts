"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formString } from "@/lib/form-utils";
import { applyPasswordReset } from "@/lib/auth-user";
import { createResetPasswordRateLimiter } from "@/lib/rate-limit-redis";

const resetPasswordRateLimiter = createResetPasswordRateLimiter();

export async function applyPasswordResetAction(formData: FormData) {
  const token = formString(formData, "token");
  const password = formString(formData, "password");
  const passwordConfirm = formString(formData, "passwordConfirm");

  if (!token) redirect("/auth/forgot-password");

  if (password.length < 8) {
    redirect(`/auth/reset-password/${token}?estado=weak_password`);
  }

  if (password !== passwordConfirm) {
    redirect(`/auth/reset-password/${token}?estado=password_mismatch`);
  }

  const key = await getResetPasswordRateLimitKey();
  const limitCheck = await resetPasswordRateLimiter.check(key);
  if (!limitCheck.allowed) {
    redirect(`/auth/reset-password/${token}?estado=rate_limited`);
  }

  const ok = await applyPasswordReset(token, password);

  if (!ok) {
    await resetPasswordRateLimiter.registerFailure(key);
    redirect("/auth/forgot-password?estado=expired");
  }

  await resetPasswordRateLimiter.reset(key);
  redirect("/auth/login?estado=password_reset");
}

async function getResetPasswordRateLimitKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim();
  return `reset-password:${ip ?? "local"}`;
}
