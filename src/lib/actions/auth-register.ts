"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/lib/i18n/navigation";
import { signIn } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { formString } from "@/lib/form-utils";
import { registerCustomer } from "@/lib/auth-user";
import { createRegisterRateLimiter, type AsyncRateLimiter } from "@/lib/rate-limit-redis";

let _registerRateLimiter: AsyncRateLimiter | undefined;

export async function registerAction(formData: FormData) {
  const locale = await getLocale();
  const registerRateLimiter = (_registerRateLimiter ??= createRegisterRateLimiter());
  const name = formString(formData, "name").trim();
  const email = formString(formData, "email").trim().toLowerCase();
  const password = formString(formData, "password");
  const passwordConfirm = formString(formData, "passwordConfirm");
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  const rawPhone = formString(formData, "phone").replace(/\D/g, "");
  const phone = rawPhone ? `+503${rawPhone}` : undefined;

  // Validaciones de formato (no cuentan como intento)
  if (!name || !email || !password) {
    redirect({ href: `/auth/register?estado=missing_fields&next=${encodeURIComponent(nextPath)}`, locale });
  }

  if (password.length < 8) {
    redirect({ href: `/auth/register?estado=weak_password&next=${encodeURIComponent(nextPath)}`, locale });
  }

  if (password !== passwordConfirm) {
    redirect({ href: `/auth/register?estado=password_mismatch&next=${encodeURIComponent(nextPath)}`, locale });
  }

  const key = await getRegisterRateLimitKey();
  const limitCheck = await registerRateLimiter.check(key);
  if (!limitCheck.allowed) {
    redirect({ href: `/auth/register?estado=rate_limited&next=${encodeURIComponent(nextPath)}`, locale });
  }

  const result = await registerCustomer({ name, email, password, phone });

  if (result.status === "email_exists") {
    await registerRateLimiter.registerFailure(key);
    redirect({ href: `/auth/register?estado=email_exists&next=${encodeURIComponent(nextPath)}`, locale });
  }

  if (result.status !== "ok") {
    await registerRateLimiter.registerFailure(key);
    redirect({ href: `/auth/register?estado=error&next=${encodeURIComponent(nextPath)}`, locale });
  }

  // Cuenta también registros exitosos para evitar creación masiva de cuentas
  // con emails únicos desde una misma IP. El siguiente intento queda bloqueado
  // cuando se alcanza el límite de la ventana.
  await registerRateLimiter.registerFailure(key);

  // Login automático post-registro
  try {
    await signIn("credentials", { email, password, redirectTo: nextPath });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect({ href: `/auth/register?estado=error&next=${encodeURIComponent(nextPath)}`, locale });
    }
    throw error;
  }
}

async function getRegisterRateLimitKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim();
  return `customer-register:${ip ?? "local"}`;
}
