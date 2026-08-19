"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/lib/i18n/navigation";
import { formString } from "@/lib/form-utils";
import { applyPasswordReset } from "@/lib/auth-user";
import { createResetPasswordRateLimiter, type AsyncRateLimiter } from "@/lib/rate-limit-redis";

let _resetPasswordRateLimiter: AsyncRateLimiter | undefined;

export async function applyPasswordResetAction(formData: FormData) {
  const locale = await getLocale();
  const resetPasswordRateLimiter = (_resetPasswordRateLimiter ??= createResetPasswordRateLimiter());
  const token = formString(formData, "token");
  const password = formString(formData, "password");
  const passwordConfirm = formString(formData, "passwordConfirm");

  if (!token) redirect({ href: "/auth/forgot-password", locale });

  if (password.length < 8) {
    redirect({ href: `/auth/reset-password/${token}?estado=weak_password`, locale });
  }

  if (password !== passwordConfirm) {
    redirect({ href: `/auth/reset-password/${token}?estado=password_mismatch`, locale });
  }

  const key = await getResetPasswordRateLimitKey();
  const limitCheck = await resetPasswordRateLimiter.check(key);
  if (!limitCheck.allowed) {
    redirect({ href: `/auth/reset-password/${token}?estado=rate_limited`, locale });
  }

  const ok = await applyPasswordReset(token, password);

  if (!ok) {
    await resetPasswordRateLimiter.registerFailure(key);
    redirect({ href: "/auth/forgot-password?estado=expired", locale });
  }

  await resetPasswordRateLimiter.reset(key);
  redirect({ href: "/auth/login?estado=password_reset", locale });
}

async function getResetPasswordRateLimitKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim();
  return `reset-password:${ip ?? "local"}`;
}
