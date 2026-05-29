"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { formString } from "@/lib/form-utils";
import { getCustomerSession, updateCustomerPassword, updateCustomerProfile } from "@/lib/auth-user";

export async function logoutCustomer() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfileAction(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/auth/login");

  const name = formString(formData, "name").trim();
  const phone = formString(formData, "phone").trim();

  if (!name) redirect("/account?estado=missing_name");

  await updateCustomerProfile(session.id, { name, phone: phone || undefined });
  redirect("/account?estado=updated");
}

export async function changePasswordAction(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/auth/login");

  const current = formString(formData, "currentPassword");
  const next = formString(formData, "newPassword");
  const confirm = formString(formData, "confirmPassword");

  if (next.length < 8) redirect("/account?estado=weak_password");
  if (next !== confirm) redirect("/account?estado=password_mismatch");

  const result = await updateCustomerPassword(session.id, current, next);

  if (result === "wrong_password") redirect("/account?estado=wrong_password");
  if (result === "no_credentials") redirect("/account?estado=no_credentials");

  redirect("/account?estado=password_changed");
}
