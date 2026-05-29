/**
 * auth-user.ts
 *
 * Operaciones de base de datos para usuarios clientes.
 * - Registro con email + contraseña
 * - Helpers de sesión del cliente (wraps auth())
 * - Reset de contraseña via VerificationToken
 */

import { randomBytes } from "node:crypto";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/admin-credentials";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Tipo de sesión del cliente
// ---------------------------------------------------------------------------

export type CustomerSession = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
};

// ---------------------------------------------------------------------------
// Sesión activa
// ---------------------------------------------------------------------------

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: session.user.role ?? "CUSTOMER",
  };
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export type RegisterResult =
  | { status: "ok"; userId: string }
  | { status: "email_exists" | "invalid" };

export async function registerCustomer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!email || !name || !input.password) return { status: "invalid" };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { status: "email_exists" };

  const passwordHash = await hashPassword(input.password);
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "CUSTOMER",
      isActive: true,
    },
  });

  return { status: "ok", userId: user.id };
}

// ---------------------------------------------------------------------------
// Reset de contraseña
// ---------------------------------------------------------------------------

const RESET_TOKEN_EXPIRY_HOURS = 1;

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null; // No revelar si el email existe o no
  if (!user.passwordHash) return null; // Cuenta OAuth sin contraseña — no aplica

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Eliminar tokens previos del mismo identifier
  await db.verificationToken.deleteMany({ where: { identifier: email } });

  await db.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return token;
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<{ email: string } | null> {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return null;
  }
  return { email: record.identifier };
}

export async function applyPasswordReset(token: string, newPassword: string): Promise<boolean> {
  const record = await verifyPasswordResetToken(token);
  if (!record) return false;

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({
    where: { email: record.email },
    data: { passwordHash },
  });

  await db.verificationToken.delete({ where: { token } });
  return true;
}

// ---------------------------------------------------------------------------
// Actualizar perfil
// ---------------------------------------------------------------------------

export async function updateCustomerProfile(
  userId: string,
  input: { name: string; phone?: string },
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
    },
  });
}

export async function updateCustomerPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<"ok" | "wrong_password" | "no_credentials"> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) return "no_credentials";

  const { verifyPassword } = await import("@/lib/admin-credentials");
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return "wrong_password";

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  return "ok";
}
