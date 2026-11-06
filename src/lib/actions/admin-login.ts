"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  clearAdminSessionCookie,
  getAdminSecretConfig,
  getSafeAdminNextPath,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { findAdminForSession, markAdminLogin, verifyAdminLogin } from "@/lib/admin-user";
import { formString } from "@/lib/form-utils";
import { defaultLocale } from "@/lib/i18n/config";
import {
  createAdminLoginRateLimiter,
  createTwoFactorRequestRateLimiter,
  createTwoFactorVerifyRateLimiter,
  type AsyncRateLimiter,
} from "@/lib/rate-limit-redis";
import { TWO_FACTOR_LIMITS, verifyTwoFactorCode } from "@/lib/two-factor";
import { clearPendingTwoFactorCookie, readPendingTwoFactorCookie } from "@/lib/two-factor-cookie";
import { deliverTwoFactorChallenge } from "@/lib/two-factor-delivery";

let _adminLoginRateLimiter: AsyncRateLimiter | undefined;
let _twoFactorRequestRateLimiter: AsyncRateLimiter | undefined;
let _twoFactorVerifyRateLimiter: AsyncRateLimiter | undefined;

/** El panel no está traducido: sus correos salen en el idioma principal. */
const ADMIN_EMAIL_LOCALE = defaultLocale;

export async function loginAdmin(formData: FormData) {
  const adminLoginRateLimiter = (_adminLoginRateLimiter ??= createAdminLoginRateLimiter());
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

  if (!user.twoFactorEnabled) {
    await openAdminSession(user.id, user.role, user.name, user.email);
    redirect(nextPath);
  }

  // La contraseña ya está probada; falta el código. La sesión no se abre acá.
  const requested = await requestAdminTwoFactorCode(user.id);

  if (requested === "rate_limited") {
    redirect(`/admin/login?estado=rate_limited&next=${encodeURIComponent(nextPath)}`);
  }

  if (requested === "unavailable") {
    redirect(`/admin/login?estado=two_factor_unavailable&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(`/admin/2fa?next=${encodeURIComponent(nextPath)}`);
}

/**
 * Segundo paso del ingreso al panel.
 *
 * Todos los desenlaces fallidos usan el mismo estado. `verifyTwoFactorCode`
 * distingue vencido, usado, sin intentos y no coincide, pero eso es para el
 * registro: decir cuál ocurrió revela si el desafío existe y cuántos intentos
 * quedan.
 */
export async function verifyAdminTwoFactor(formData: FormData) {
  const nextPath = getSafeAdminNextPath(formString(formData, "next"));
  const pending = await readPendingTwoFactorCookie("admin");

  if (!pending) {
    redirect(`/admin/login?estado=two_factor_restart&next=${encodeURIComponent(nextPath)}`);
  }

  const verifyRateLimiter = (_twoFactorVerifyRateLimiter ??= createTwoFactorVerifyRateLimiter());
  const ipKey = await getAdminTwoFactorIpKey();

  const limitCheck = await verifyRateLimiter.check(ipKey);
  if (!limitCheck.allowed) {
    redirect(`/admin/2fa?estado=rate_limited&next=${encodeURIComponent(nextPath)}`);
  }

  const code = formString(formData, "code").replace(/\D/g, "");

  // Un código de largo equivocado no llega a la base: los intentos se cuentan
  // antes de comparar, así que uno a medio escribir gastaría uno de los cinco.
  if (code.length !== TWO_FACTOR_LIMITS.codeLength) {
    await verifyRateLimiter.registerFailure(ipKey);
    redirect(`/admin/2fa?estado=two_factor_invalid&next=${encodeURIComponent(nextPath)}`);
  }

  const result = await verifyTwoFactorCode(pending.challengeId, code);

  // El desafío tiene que ser el de la cuenta que la cookie dice. Coinciden
  // siempre salvo que la firma se haya roto; es una línea y cierra el caso.
  if (!result.ok || result.userId !== pending.userId) {
    await verifyRateLimiter.registerFailure(ipKey);
    redirect(`/admin/2fa?estado=two_factor_invalid&next=${encodeURIComponent(nextPath)}`);
  }

  // Se relee al admin: el desafío vive diez minutos y en ese rato la cuenta
  // puede desactivarse o perder el rol.
  const user = await findAdminForSession(result.userId);

  if (!user) {
    await clearPendingTwoFactorCookie("admin");
    redirect(`/admin/login?estado=two_factor_restart&next=${encodeURIComponent(nextPath)}`);
  }

  await openAdminSession(user.id, user.role, user.name, user.email);
  await clearPendingTwoFactorCookie("admin");

  redirect(nextPath);
}

export async function resendAdminTwoFactorCode(formData: FormData) {
  const nextPath = getSafeAdminNextPath(formString(formData, "next"));
  const pending = await readPendingTwoFactorCookie("admin");

  if (!pending) {
    redirect(`/admin/login?estado=two_factor_restart&next=${encodeURIComponent(nextPath)}`);
  }

  const requested = await requestAdminTwoFactorCode(pending.userId);

  if (requested === "rate_limited") {
    redirect(`/admin/2fa?estado=rate_limited&next=${encodeURIComponent(nextPath)}`);
  }

  if (requested === "unavailable") {
    redirect(`/admin/login?estado=two_factor_unavailable&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(`/admin/2fa?estado=two_factor_sent&next=${encodeURIComponent(nextPath)}`);
}

export async function cancelAdminTwoFactorLogin() {
  await clearPendingTwoFactorCookie("admin");
  redirect("/admin/login");
}

export async function logoutAdmin() {
  await clearAdminSessionCookie();
  redirect("/admin/login?estado=logged_out");
}

// ---------------------------------------------------------------------------
// Piezas compartidas por los dos pasos
// ---------------------------------------------------------------------------

/**
 * Abre la sesión del panel.
 *
 * `markAdminLogin` va acá y no en la verificación de contraseña: con segundo
 * factor, contraseña correcta sin código **no es un ingreso**, y `lastLoginAt`
 * quedaba registrando intentos a medio camino.
 */
async function openAdminSession(
  userId: string,
  role: Parameters<typeof setAdminSessionCookie>[1],
  name: string | null,
  email: string,
) {
  await setAdminSessionCookie(userId, role, name?.trim() || email);
  await markAdminLogin(userId);
}

type AdminCodeRequest = "sent" | "rate_limited" | "unavailable";

/**
 * Pide un código para el panel.
 *
 * El tope se cuenta por cuenta y no por IP: lo que protege es la bandeja de
 * quien recibe los códigos, y esa bandeja es la misma desde cualquier lugar.
 */
async function requestAdminTwoFactorCode(userId: string): Promise<AdminCodeRequest> {
  const requestRateLimiter = (_twoFactorRequestRateLimiter ??= createTwoFactorRequestRateLimiter());
  const accountKey = `two-factor-request:${userId}`;

  const limitCheck = await requestRateLimiter.check(accountKey);
  const attempt = limitCheck.allowed
    ? await requestRateLimiter.registerFailure(accountKey)
    : limitCheck;

  if (!attempt.allowed) return "rate_limited";

  return deliverTwoFactorChallenge(userId, ADMIN_EMAIL_LOCALE, "admin");
}

async function getAdminLoginRateLimitKey() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  return `admin-login:${forwardedFor || realIp || "local"}`;
}

async function getAdminTwoFactorIpKey() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  return `two-factor-verify:${forwardedFor || realIp || "local"}`;
}
