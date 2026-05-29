"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { formString } from "@/lib/form-utils";

export async function loginWithCredentials(formData: FormData) {
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));

  try {
    await signIn("credentials", {
      email: formString(formData, "email"),
      password: formString(formData, "password"),
      redirectTo: nextPath,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/auth/login?estado=invalid&next=${encodeURIComponent(nextPath)}`);
    }
    throw error; // redirect() lanza un error especial que debe propagarse
  }
}

export async function loginWithGoogle(formData: FormData) {
  const nextPath = getSafeCustomerNextPath(formString(formData, "next"));
  try {
    await signIn("google", { redirectTo: nextPath });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/auth/login?estado=oauth_error&next=${encodeURIComponent(nextPath)}`);
    }
    throw error;
  }
}
