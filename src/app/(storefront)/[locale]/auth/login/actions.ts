"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { getActionLocale } from "@/lib/i18n/action-locale";
import { asLocaleHref, getPathname, redirect } from "@/lib/i18n/navigation";
import { signIn } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { formString } from "@/lib/form-utils";
import { createCustomerLoginRateLimiter, type AsyncRateLimiter } from "@/lib/rate-limit-redis";

let _loginRateLimiter: AsyncRateLimiter | undefined;

export async function loginWithCredentials(formData: FormData) {
  const locale = await getActionLocale();
  const loginRateLimiter = (_loginRateLimiter ??= createCustomerLoginRateLimiter());
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  const key = await getLoginRateLimitKey();

  const limitCheck = await loginRateLimiter.check(key);
  if (!limitCheck.allowed) {
    redirect({ href: { pathname: "/auth/login", query: { estado: "rate_limited", next: nextPath } }, locale });
  }

  try {
    await signIn("credentials", {
      email: formString(formData, "email"),
      password: formString(formData, "password"),
      // next-auth emite su propio redirect, sin pasar por next-intl: si no se
      // prefija acá, el usuario aterriza en una URL sin idioma.
      redirectTo: getPathname({ href: asLocaleHref(nextPath), locale }),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const failed = await loginRateLimiter.registerFailure(key);
      const estado = failed.allowed ? "invalid" : "rate_limited";
      redirect({ href: { pathname: "/auth/login", query: { estado, next: nextPath } }, locale });
    }
    await loginRateLimiter.reset(key);
    throw error; // redirect() lanza un error especial que debe propagarse
  }
}

export async function loginWithGoogle(formData: FormData) {
  const locale = await getActionLocale();
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  try {
    await signIn("google", { redirectTo: getPathname({ href: asLocaleHref(nextPath), locale }) });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect({ href: { pathname: "/auth/login", query: { estado: "oauth_error", next: nextPath } }, locale });
    }
    throw error;
  }
}

async function getLoginRateLimitKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim();
  return `customer-login:${ip ?? "local"}`;
}
