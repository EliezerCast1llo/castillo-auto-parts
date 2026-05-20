"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSessionCookie,
  getAdminAccessConfig,
  getSafeAdminNextPath,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { verifyAdminPassword } from "@/lib/admin-session";

export async function loginAdmin(formData: FormData) {
  const config = getAdminAccessConfig();
  const nextPath = getSafeAdminNextPath(formString(formData, "next"));

  if (!config.isConfigured) {
    redirect(`/admin/login?estado=not_configured&next=${encodeURIComponent(nextPath)}`);
  }

  if (!verifyAdminPassword(formString(formData, "password"), config.password)) {
    redirect(`/admin/login?estado=invalid&next=${encodeURIComponent(nextPath)}`);
  }

  await setAdminSessionCookie();
  redirect(nextPath);
}

export async function logoutAdmin() {
  await clearAdminSessionCookie();
  redirect("/admin/login?estado=logged_out");
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
