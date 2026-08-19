"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/lib/i18n/navigation";
import { signIn } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { formString } from "@/lib/form-utils";
import { createCustomerLoginRateLimiter, type AsyncRateLimiter } from "@/lib/rate-limit-redis";

let _loginRateLimiter: AsyncRateLimiter | undefined;

export async function loginWithCredentials(formData: FormData) {
  const locale = await getLocale();
  const loginRateLimiter = (_loginRateLimiter ??= createCustomerLoginRateLimiter());
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  const key = await getLoginRateLimitKey();

  const limitCheck = await loginRateLimiter.check(key);
  if (!limitCheck.allowed) {
    redirect({ href: `/auth/login?estado=rate_limited&next=${encodeURIComponent(nextPath)}`, locale });
  }

  try {
    await signIn("credentials", {
      email: formString(formData, "email"),
      password: formString(formData, "password"),
      redirectTo: nextPath,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const failed = await loginRateLimiter.registerFailure(key);
      const estado = failed.allowed ? "invalid" : "rate_limited";
      redirect({ href: `/auth/login?estado=${estado}&next=${encodeURIComponent(nextPath)}`, locale });
    }
    await loginRateLimiter.reset(key);
    throw error; // redirect({ href: , locale }) lanza un error especial que debe propagarse
  }
}

export async function loginWithGoogle(formData: FormData) {
  const locale = await getLocale();
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  try {
    await signIn("google", { redirectTo: nextPath });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect({ href: `/auth/login?estado=oauth_error&next=${encodeURIComponent(nextPath)}`, locale });
    }
    throw error;
  }
}

async function getLoginRateLimitKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim();
  return `customer-login:${ip ?? "local"}`;
}
