"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { formString } from "@/lib/form-utils";
import { createCustomerLoginRateLimiter } from "@/lib/rate-limit-redis";

const loginRateLimiter = createCustomerLoginRateLimiter();

export async function loginWithCredentials(formData: FormData) {
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  const key = await getLoginRateLimitKey();

  const limitCheck = await loginRateLimiter.check(key);
  if (!limitCheck.allowed) {
    redirect(`/auth/login?estado=rate_limited&next=${encodeURIComponent(nextPath)}`);
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
      redirect(`/auth/login?estado=${estado}&next=${encodeURIComponent(nextPath)}`);
    }
    await loginRateLimiter.reset(key);
    throw error; // redirect() lanza un error especial que debe propagarse
  }
}

export async function loginWithGoogle(formData: FormData) {
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  try {
    await signIn("google", { redirectTo: nextPath });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/auth/login?estado=oauth_error&next=${encodeURIComponent(nextPath)}`);
    }
    throw error;
  }
}

async function getLoginRateLimitKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim();
  return `customer-login:${ip ?? "local"}`;
}
