/**
 * admin-auth.ts
 *
 * Capa de autenticación/autorización para el panel admin.
 *
 * Flujo:
 *   1. El usuario hace login con email + contraseña (verificado contra DB).
 *   2. Se emite un token v2 firmado con ADMIN_ACCESS_SECRET que lleva userId, role y displayName.
 *   3. El middleware Edge verifica el token en cada request a /admin/**.
 *   4. Las pages/actions llaman a requireAdminRole() para verificación Node.js (defensa en profundidad).
 *
 * ADMIN_ACCESS_SECRET sigue siendo necesario para firmar/verificar tokens.
 * ADMIN_ACCESS_PASSWORD ya no existe — la contraseña es por usuario en DB.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "./admin-session";
import type { AdminSessionUser } from "./admin-user";

export { type AdminSessionUser };

export const ADMIN_SESSION_COOKIE = "castillo_admin_session";

// ---------------------------------------------------------------------------
// Rutas por defecto según rol (para redirects post-login y acceso denegado)
// ---------------------------------------------------------------------------

export const ROLE_HOME: Record<UserRole, string> = {
  CUSTOMER: "/",
  ADMIN: "/admin/orders",
  SALES: "/admin/orders",
  WAREHOUSE: "/admin/orders",
  SUPPORT: "/admin/orders",
  ACCOUNTING: "/admin/orders",
  MARKETING: "/admin/products",
};

// ---------------------------------------------------------------------------
// Validación de configuración del secreto
// ---------------------------------------------------------------------------

export type AdminSecretConfig = {
  issue: "missing" | "weak_secret" | null;
  isConfigured: boolean;
  isSafeForRuntime: boolean;
  secret: string;
};

const weakAdminSecrets = new Set(["admin-secret", "change-me", "change-me-secret", "secret"]);

export function getAdminSecretConfig(environment = process.env.NODE_ENV): AdminSecretConfig {
  const secret = process.env.ADMIN_ACCESS_SECRET?.trim() ?? "";
  const issue = getAdminSecretIssue(secret, environment);
  return {
    issue,
    isConfigured: issue !== "missing",
    isSafeForRuntime: issue === null,
    secret,
  };
}

export function getAdminSecretIssue(
  secret: string,
  environment = process.env.NODE_ENV,
): AdminSecretConfig["issue"] {
  if (!secret) return "missing";
  if (environment !== "production") return null;
  if (secret.length < 32 || weakAdminSecrets.has(secret.toLowerCase())) return "weak_secret";
  return null;
}

// ---------------------------------------------------------------------------
// Lectura del token (sin redirigir — para uso en middleware y route handlers)
// ---------------------------------------------------------------------------

export async function getSessionAdminUser(): Promise<AdminSessionUser | null> {
  const config = getAdminSecretConfig();
  if (!config.isConfigured || !config.isSafeForRuntime) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const payload = verifyAdminSessionToken(token, config.secret);
  if (!payload) return null;

  // Revalida isActive y rol contra la BD en cada request del panel admin.
  // El panel admin es bajo volumen; la consulta es barata y garantiza que
  // un usuario desactivado o con rol cambiado pierde acceso de inmediato.
  const dbUser = await db.user.findUnique({
    where: { id: payload.userId },
    select: { isActive: true, role: true },
  });
  if (!dbUser || !dbUser.isActive) return null;

  return {
    id: payload.userId,
    email: payload.displayName.includes("@") ? payload.displayName : "",
    name: payload.displayName.includes("@") ? null : payload.displayName,
    role: dbUser.role,
  };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getSessionAdminUser()) !== null;
}

// ---------------------------------------------------------------------------
// Guards para pages y server actions (redirigen si no autorizado)
// ---------------------------------------------------------------------------

/**
 * Verifica que el usuario está autenticado y tiene al menos uno de los roles
 * permitidos. Si no, redirige al login o a su ruta home.
 * Devuelve el AdminSessionUser para uso en la página/action.
 */
export async function requireAdminRole(...allowedRoles: UserRole[]): Promise<AdminSessionUser> {
  const config = getAdminSecretConfig();
  if (!config.isConfigured) redirect("/admin/login?estado=not_configured");
  if (!config.isSafeForRuntime) redirect("/admin/login?estado=unsafe_config");

  // getSessionAdminUser revalida isActive y rol contra la BD
  const user = await getSessionAdminUser();
  if (!user) redirect("/admin/login");

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    redirect(ROLE_HOME[user.role] ?? "/admin/orders");
  }

  return user;
}

// ---------------------------------------------------------------------------
// Manejo de la cookie de sesión
// ---------------------------------------------------------------------------

export async function setAdminSessionCookie(
  userId: string,
  role: UserRole,
  displayName: string,
): Promise<void> {
  const config = getAdminSecretConfig();
  if (!config.isConfigured || !config.isSafeForRuntime) return;

  const token = createAdminSessionToken(config.secret, userId, role, displayName);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Versión de la verificación de rol apta para route handlers:
 * devuelve { user } en éxito, o { response } con 401/403 sin redirigir.
 */
export async function getAdminUserForHandler(
  ...allowedRoles: UserRole[]
): Promise<{ user: AdminSessionUser } | { response: NextResponse }> {
  const user = await getSessionAdminUser();
  if (!user) {
    return { response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }) };
  }
  return { user };
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function getSafeAdminNextPath(value: string | undefined): string {
  const isAdminPath = value === "/admin" || Boolean(value?.startsWith("/admin/"));
  if (!value || !isAdminPath || value.startsWith("/admin/login")) {
    return "/admin/orders";
  }
  return value;
}
