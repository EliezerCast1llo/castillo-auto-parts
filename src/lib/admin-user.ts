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

export type AdminUserRecord = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
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
): Promise<AdminSessionUser | null> {
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

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  return db.user.findMany({
    where: { role: { in: ADMIN_ROLES } },
    select: {
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
    password?: string;
  },
): Promise<void> {
  const data: Parameters<typeof db.user.update>[0]["data"] = {
    name: input.name.trim(),
    role: input.role,
    isActive: input.isActive,
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
