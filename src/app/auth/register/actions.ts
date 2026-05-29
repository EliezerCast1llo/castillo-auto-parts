"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { formString } from "@/lib/form-utils";
import { registerCustomer } from "@/lib/auth-user";

export async function registerAction(formData: FormData) {
  const name = formString(formData, "name").trim();
  const email = formString(formData, "email").trim().toLowerCase();
  const password = formString(formData, "password");
  const passwordConfirm = formString(formData, "passwordConfirm");
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));

  if (!name || !email || !password) {
    redirect(`/auth/register?estado=missing_fields&next=${encodeURIComponent(nextPath)}`);
  }

  if (password.length < 8) {
    redirect(`/auth/register?estado=weak_password&next=${encodeURIComponent(nextPath)}`);
  }

  if (password !== passwordConfirm) {
    redirect(`/auth/register?estado=password_mismatch&next=${encodeURIComponent(nextPath)}`);
  }

  const result = await registerCustomer({ name, email, password });

  if (result.status === "email_exists") {
    redirect(`/auth/register?estado=email_exists&next=${encodeURIComponent(nextPath)}`);
  }

  if (result.status !== "ok") {
    redirect(`/auth/register?estado=error&next=${encodeURIComponent(nextPath)}`);
  }

  // Login automático post-registro
  await signIn("credentials", { email, password, redirectTo: nextPath });
}
