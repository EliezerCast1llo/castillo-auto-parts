"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { formString } from "@/lib/form-utils";
import { getActionLocale } from "@/lib/i18n/action-locale";
import { asLocaleHref, getPathname, redirect } from "@/lib/i18n/navigation";
import {
  createTwoFactorRequestRateLimiter,
  createTwoFactorVerifyRateLimiter,
  type AsyncRateLimiter,
} from "@/lib/rate-limit-redis";
import { TWO_FACTOR_LIMITS } from "@/lib/two-factor";
import { clearPendingTwoFactorCookie, readPendingTwoFactorCookie } from "@/lib/two-factor-cookie";
import { deliverTwoFactorChallenge } from "@/lib/two-factor-delivery";

let _verifyRateLimiter: AsyncRateLimiter | undefined;
let _requestRateLimiter: AsyncRateLimiter | undefined;

/**
 * Comprobación del código.
 *
 * Todos los desenlaces fallidos redirigen con **el mismo código de estado**.
 * `verifyTwoFactorCode` distingue entre vencido, ya usado, sin intentos y no
 * coincide, pero esa distinción es para el registro interno: decirle a quien
 * ataca cuál de las cuatro ocurrió le dice si el desafío existe, si lo tiene
 * vivo y cuántos intentos le quedan.
 */
export async function verifyTwoFactorLogin(formData: FormData) {
  const locale = await getActionLocale();
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  const pending = await readPendingTwoFactorCookie();

  if (!pending) {
    return redirect({
      href: { pathname: "/auth/login", query: { estado: "two_factor_restart", next: nextPath } },
      locale,
    });
  }

  const verifyRateLimiter = (_verifyRateLimiter ??= createTwoFactorVerifyRateLimiter());
  const ipKey = await getTwoFactorIpKey();

  const limitCheck = await verifyRateLimiter.check(ipKey);
  if (!limitCheck.allowed) {
    return redirect({ href: { pathname: "/auth/2fa", query: { estado: "rate_limited", next: nextPath } }, locale });
  }

  const code = formString(formData, "code").replace(/\D/g, "");

  // Un código de largo equivocado no llega a la base. No es una validación
  // cosmética: `verifyTwoFactorCode` cuenta el intento antes de comparar, así
  // que mandarle un código a medio escribir gastaría uno de los cinco.
  if (code.length !== TWO_FACTOR_LIMITS.codeLength) {
    await verifyRateLimiter.registerFailure(ipKey);
    return redirect({
      href: { pathname: "/auth/2fa", query: { estado: "two_factor_invalid", next: nextPath } },
      locale,
    });
  }

  try {
    await signIn("two-factor", {
      challengeId: pending.challengeId,
      code,
      redirectTo: getPathname({ href: asLocaleHref(nextPath), locale }),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      await verifyRateLimiter.registerFailure(ipKey);
      return redirect({
        href: { pathname: "/auth/2fa", query: { estado: "two_factor_invalid", next: nextPath } },
        locale,
      });
    }
    throw error; // redirect() lanza un error especial que debe propagarse
  }
}

/** Reenvío. Crea un desafío nuevo, lo que invalida el anterior. */
export async function resendTwoFactorCode(formData: FormData) {
  const locale = await getActionLocale();
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  const pending = await readPendingTwoFactorCookie();

  if (!pending) {
    return redirect({
      href: { pathname: "/auth/login", query: { estado: "two_factor_restart", next: nextPath } },
      locale,
    });
  }

  const requestRateLimiter = (_requestRateLimiter ??= createTwoFactorRequestRateLimiter());
  const accountKey = `two-factor-request:${pending.userId}`;

  const limitCheck = await requestRateLimiter.check(accountKey);
  const attempt = limitCheck.allowed
    ? await requestRateLimiter.registerFailure(accountKey)
    : limitCheck;

  if (!attempt.allowed) {
    return redirect({ href: { pathname: "/auth/2fa", query: { estado: "rate_limited", next: nextPath } }, locale });
  }

  const delivery = await deliverTwoFactorChallenge(pending.userId, locale);
  if (delivery === "unavailable") {
    return redirect({
      href: { pathname: "/auth/login", query: { estado: "two_factor_unavailable", next: nextPath } },
      locale,
    });
  }

  redirect({
    href: { pathname: "/auth/2fa", query: { estado: "two_factor_sent", next: nextPath } },
    locale,
  });
}

/**
 * Abandonar la verificación.
 *
 * Es el único lugar donde la cookie se puede borrar de verdad: el camino
 * exitoso termina en el redirect que lanza `signIn`, y después de eso ya no hay
 * respuesta donde escribir cabeceras.
 */
export async function cancelTwoFactorLogin(formData: FormData) {
  const locale = await getActionLocale();
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));

  await clearPendingTwoFactorCookie();

  redirect({ href: { pathname: "/auth/login", query: { next: nextPath } }, locale });
}

async function getTwoFactorIpKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim();
  return `two-factor-verify:${ip ?? "local"}`;
}
