"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { getActionLocale } from "@/lib/i18n/action-locale";
import { asLocaleHref, getPathname, redirect } from "@/lib/i18n/navigation";
import { signIn } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { verifyCustomerCredentials } from "@/lib/customer-credentials";
import { formString } from "@/lib/form-utils";
import { deliverTwoFactorChallenge } from "@/lib/two-factor-delivery";
import {
  createCustomerLoginRateLimiter,
  createTwoFactorRequestRateLimiter,
  type AsyncRateLimiter,
} from "@/lib/rate-limit-redis";

let _loginRateLimiter: AsyncRateLimiter | undefined;
let _twoFactorRequestRateLimiter: AsyncRateLimiter | undefined;

/**
 * Ingreso con correo y contraseña.
 *
 * La contraseña se verifica por separado en vez de dejársela a
 * `signIn("credentials")` porque `signIn` crea la sesión en el mismo paso, y
 * con segundo factor encendido hace falta el resultado de la contraseña
 * **antes** de que exista sesión: ahí se decide si se entra o si se manda un
 * código.
 */
export async function loginWithCredentials(formData: FormData) {
  const locale = await getActionLocale();
  const loginRateLimiter = (_loginRateLimiter ??= createCustomerLoginRateLimiter());
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  const key = await getLoginRateLimitKey();

  const limitCheck = await loginRateLimiter.check(key);
  if (!limitCheck.allowed) {
    return redirect({ href: { pathname: "/auth/login", query: { estado: "rate_limited", next: nextPath } }, locale });
  }

  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const user = await verifyCustomerCredentials(email, password);

  if (!user) {
    const failed = await loginRateLimiter.registerFailure(key);
    const estado = failed.allowed ? "invalid" : "rate_limited";
    return redirect({ href: { pathname: "/auth/login", query: { estado, next: nextPath } }, locale });
  }

  await loginRateLimiter.reset(key);

  if (!user.twoFactorEnabled) {
    try {
      // La contraseña se vuelve a verificar dentro del proveedor. Es un scrypt
      // de más por ingreso exitoso, y se paga a propósito: la alternativa es
      // abrir una vía que cree sesión sin pasar por `authorize`, que es justo
      // donde vive el rechazo de las cuentas con segundo factor.
      await signIn("credentials", {
        email,
        password,
        // next-auth emite su propio redirect, sin pasar por next-intl: si no se
        // prefija acá, el usuario aterriza en una URL sin idioma.
        redirectTo: getPathname({ href: asLocaleHref(nextPath), locale }),
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return redirect({ href: { pathname: "/auth/login", query: { estado: "invalid", next: nextPath } }, locale });
      }
      throw error; // redirect() lanza un error especial que debe propagarse
    }
    return;
  }

  // Segundo factor: la contraseña ya está probada, falta el código.
  const requestRateLimiter = (_twoFactorRequestRateLimiter ??= createTwoFactorRequestRateLimiter());

  // La clave es la cuenta y no la IP: lo que este tope protege es la bandeja de
  // quien recibe los códigos, y esa bandeja es la misma desde cualquier IP.
  const accountKey = `two-factor-request:${user.id}`;
  const requestCheck = await requestRateLimiter.check(accountKey);
  const requestAttempt = requestCheck.allowed
    ? await requestRateLimiter.registerFailure(accountKey)
    : requestCheck;

  if (!requestAttempt.allowed) {
    return redirect({ href: { pathname: "/auth/login", query: { estado: "rate_limited", next: nextPath } }, locale });
  }

  const delivery = await deliverTwoFactorChallenge(user.id, locale);
  if (delivery === "unavailable") {
    return redirect({
      href: { pathname: "/auth/login", query: { estado: "two_factor_unavailable", next: nextPath } },
      locale,
    });
  }

  redirect({ href: { pathname: "/auth/2fa", query: { next: nextPath } }, locale });
}

export async function loginWithGoogle(formData: FormData) {
  const locale = await getActionLocale();
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  try {
    await signIn("google", { redirectTo: getPathname({ href: asLocaleHref(nextPath), locale }) });
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect({ href: { pathname: "/auth/login", query: { estado: "oauth_error", next: nextPath } }, locale });
    }
    throw error;
  }
}

async function getLoginRateLimitKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim();
  return `customer-login:${ip ?? "local"}`;
}
