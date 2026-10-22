"use server";

import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { requireAdminRole } from "@/lib/admin-auth";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { formString } from "@/lib/form-utils";
import {
  ADMIN_ROLES,
  adminEmailExists,
  createAdminUser,
  updateAdminUser,
} from "@/lib/admin-user";

// ---------------------------------------------------------------------------
// Crear usuario
// ---------------------------------------------------------------------------

export async function createAdminUserAction(formData: FormData) {
  const adminUser = await requireAdminRole("ADMIN");

  const email = formString(formData, "email").toLowerCase().trim();
  const name = formString(formData, "name").trim();
  const role = formString(formData, "role") as UserRole;
  const password = formString(formData, "password");
  const passwordConfirm = formString(formData, "passwordConfirm");

  if (!email || !name || !role || !password) {
    redirect("/admin/users/new?estado=missing_fields");
  }

  if (!ADMIN_ROLES.includes(role)) {
    redirect("/admin/users/new?estado=invalid_role");
  }

  if (password.length < 8) {
    redirect("/admin/users/new?estado=weak_password");
  }

  if (password !== passwordConfirm) {
    redirect("/admin/users/new?estado=password_mismatch");
  }

  if (await adminEmailExists(email)) {
    redirect("/admin/users/new?estado=email_exists");
  }

  const newUser = await createAdminUser({ email, name, role, password });

  await db.$transaction(async (tx) => {
    await writeAdminAuditLog(tx, {
      action: "CREATE_ADMIN_USER",
      entityType: "User",
      entityId: newUser.id,
      entityLabel: newUser.email,
      adminUserId: adminUser.id,
      adminUserEmail: adminUser.email || adminUser.name || "",
    });
  });

  redirect("/admin/users?estado=created");
}

// ---------------------------------------------------------------------------
// Editar usuario
// ---------------------------------------------------------------------------

export async function updateAdminUserAction(formData: FormData) {
  const adminUser = await requireAdminRole("ADMIN");

  const id = formString(formData, "id");
  const name = formString(formData, "name").trim();
  const role = formString(formData, "role") as UserRole;
  const isActive = formData.get("isActive") === "true";
  const password = formString(formData, "password");
  const passwordConfirm = formString(formData, "passwordConfirm");

  if (!id || !name || !role) {
    redirect(`/admin/users/${id}?estado=missing_fields`);
  }

  if (!ADMIN_ROLES.includes(role)) {
    redirect(`/admin/users/${id}?estado=invalid_role`);
  }

  if (password && password.length < 8) {
    redirect(`/admin/users/${id}?estado=weak_password`);
  }

  if (password && password !== passwordConfirm) {
    redirect(`/admin/users/${id}?estado=password_mismatch`);
  }

  await updateAdminUser(id, {
    name,
    role,
    isActive,
    ...(password ? { password } : {}),
  });

  await db.$transaction(async (tx) => {
    await writeAdminAuditLog(tx, {
      action: "UPDATE_ADMIN_USER",
      entityType: "User",
      entityId: id,
      entityLabel: name,
      adminUserId: adminUser.id,
      adminUserEmail: adminUser.email || adminUser.name || "",
    });
  });

  redirect(`/admin/users/${id}?estado=updated`);
}
