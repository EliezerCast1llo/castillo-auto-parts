"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { formString } from "@/lib/form-utils";
import { getCustomerSession, updateCustomerPassword } from "@/lib/auth-user";

export async function logoutCustomer() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfileAction(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/auth/login");

  const phone = formString(formData, "phone").trim();
  const phoneDigits = phone.replace(/\D/g, "");

  if (phone && phoneDigits.length < 8) redirect("/account?estado=invalid_phone");

  await db.user.update({
    where: { id: session.id },
    data: { phone: phone || null },
  });
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
