"use server";

import { redirect } from "next/navigation";
import { formString } from "@/lib/form-utils";
import { applyPasswordReset } from "@/lib/auth-user";

export async function applyPasswordResetAction(formData: FormData) {
  const token = formString(formData, "token");
  const password = formString(formData, "password");
  const passwordConfirm = formString(formData, "passwordConfirm");

  if (!token) redirect("/auth/forgot-password");

  if (password.length < 8) {
    redirect(`/auth/reset-password/${token}?estado=weak_password`);
  }

  if (password !== passwordConfirm) {
    redirect(`/auth/reset-password/${token}?estado=password_mismatch`);
  }

  const ok = await applyPasswordReset(token, password);

  if (!ok) {
    redirect("/auth/forgot-password?estado=expired");
  }

  redirect("/auth/login?estado=password_reset");
}
