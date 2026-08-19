"use server";

import { getLocale } from "next-intl/server";
import { getPathname, redirect } from "@/lib/i18n/navigation";
import { signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { formString } from "@/lib/form-utils";
import { getCustomerSession, updateCustomerPassword } from "@/lib/auth-user";

export async function logoutCustomer() {
  // `signOut` redirige por su cuenta, fuera de next-intl: hay que darle la home
  // del idioma actual o el usuario cae en `/` sin prefijo.
  const locale = await getLocale();
  await signOut({ redirectTo: getPathname({ href: "/", locale }) });
}

export async function updateProfileAction(formData: FormData) {
  const locale = await getLocale();
  const session = await getCustomerSession();
  if (!session) return redirect({ href: "/auth/login", locale });

  const phone = formString(formData, "phone").trim();
  const phoneDigits = phone.replace(/\D/g, "");

  if (phone && phoneDigits.length < 8) redirect({ href: "/account?estado=invalid_phone", locale });

  await db.user.update({
    where: { id: session.id },
    data: { phone: phone || null },
  });
  redirect({ href: "/account?estado=updated", locale });
}

export async function changePasswordAction(formData: FormData) {
  const locale = await getLocale();
  const session = await getCustomerSession();
  if (!session) return redirect({ href: "/auth/login", locale });

  const current = formString(formData, "currentPassword");
  const next = formString(formData, "newPassword");
  const confirm = formString(formData, "confirmPassword");

  if (next.length < 8) redirect({ href: "/account?estado=weak_password", locale });
  if (next !== confirm) redirect({ href: "/account?estado=password_mismatch", locale });

  const result = await updateCustomerPassword(session.id, current, next);

  if (result === "wrong_password") redirect({ href: "/account?estado=wrong_password", locale });
  if (result === "no_credentials") redirect({ href: "/account?estado=no_credentials", locale });

  redirect({ href: "/account?estado=password_changed", locale });
}
