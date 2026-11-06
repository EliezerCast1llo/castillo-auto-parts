/**
 * admin-user.ts
 *
 * Operaciones de base de datos para usuarios admin.
 * - Lookup por email para login
 * - CRUD para la gestión de usuarios desde el panel /admin/users
 */

import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "./admin-credentials";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

/** Lo que devuelve la verificación de contraseña: el usuario y si falta el código. */
export type VerifiedAdmin = AdminSessionUser & {
  twoFactorEnabled: boolean;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// Roles que tienen acceso al panel admin (todos excepto CUSTOMER)
// ---------------------------------------------------------------------------

export const ADMIN_ROLES: UserRole[] = [
  "ADMIN",
  "SALES",
  "WAREHOUSE",
  "SUPPORT",
  "ACCOUNTING",
  "MARKETING",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: "Cliente",
  ADMIN: "Administrador",
  SALES: "Ventas",
  WAREHOUSE: "Bodega",
  SUPPORT: "Soporte",
  ACCOUNTING: "Contabilidad",
  MARKETING: "Marketing",
};

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function verifyAdminLogin(
  email: string,
  password: string,
): Promise<VerifiedAdmin | null> {
  const user = await db.user.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      isActive: true,
      role: { in: ADMIN_ROLES },
      passwordHash: { not: null },
    },
  });

  if (!user?.passwordHash) return null;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

/**
 * Marca el ingreso como consumado.
 *
 * Estaba adentro de `verifyAdminLogin`, y ahí pasó a ser mentira cuando se
 * sumó el segundo factor: con la contraseña correcta pero sin el código **no
 * hubo ingreso**, y `lastLoginAt` quedaba registrando intentos a medio camino.
 * Quien audita esa columna la lee como "entró", así que se escribe recién
 * cuando la sesión existe.
 */
export async function markAdminLogin(userId: string): Promise<void> {
  await db.user.update({
    data: { lastLoginAt: new Date() },
    where: { id: userId },
  });
}

/**
 * Relee al admin para el segundo paso.
 *
 * El desafío vive diez minutos; en ese rato la cuenta puede desactivarse o
 * perder el rol. Confiar en lo que se leyó al verificar la contraseña dejaría
 * entrar a quien ya no debería.
 */
export async function findAdminForSession(userId: string): Promise<AdminSessionUser | null> {
  const user = await db.user.findFirst({
    where: { id: userId, isActive: true, role: { in: ADMIN_ROLES } },
    select: { email: true, id: true, name: true, role: true },
  });

  return user ?? null;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  return db.user.findMany({
    where: { role: { in: ADMIN_ROLES } },
    select: {
      twoFactorEnabled: true,
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAdminUserById(id: string): Promise<AdminUserRecord | null> {
  const user = await db.user.findFirst({
    where: { id, role: { in: ADMIN_ROLES } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      twoFactorEnabled: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  return user ?? null;
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}): Promise<AdminSessionUser> {
  const passwordHash = await hashPassword(input.password);
  const user = await db.user.create({
    data: {
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      role: input.role,
      passwordHash,
      isActive: true,
    },
  });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function updateAdminUser(
  id: string,
  input: {
    name: string;
    role: UserRole;
    isActive: boolean;
    twoFactorEnabled: boolean;
    password?: string;
  },
): Promise<void> {
  const data: Parameters<typeof db.user.update>[0]["data"] = {
    name: input.name.trim(),
    role: input.role,
    isActive: input.isActive,
    twoFactorEnabled: input.twoFactorEnabled,
  };

  if (input.password) {
    data.passwordHash = await hashPassword(input.password);
  }

  await db.user.update({ where: { id }, data });
}

export async function adminEmailExists(email: string, excludeId?: string): Promise<boolean> {
  const user = await db.user.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return user !== null;
}
