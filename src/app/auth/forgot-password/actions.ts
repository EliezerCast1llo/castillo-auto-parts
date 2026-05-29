"use server";

import { redirect } from "next/navigation";
import { getEmailProvider, getTransactionalEmailFrom } from "@/lib/email";
import { formString } from "@/lib/form-utils";
import { createPasswordResetToken } from "@/lib/auth-user";

export async function requestPasswordReset(formData: FormData) {
  const email = formString(formData, "email").trim().toLowerCase();

  if (!email) {
    redirect("/auth/forgot-password?estado=missing_email");
  }

  // Siempre mostrar éxito para no revelar si el email existe
  const token = await createPasswordResetToken(email);

  if (token) {
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/reset-password/${token}`;

    try {
      const provider = getEmailProvider();
      await provider.sendEmail({
        from: getTransactionalEmailFrom(),
        to: email,
        subject: "Restablecer contraseña — Castillo Auto Parts",
        text: `Usa este enlace para restablecer tu contraseña (válido por 1 hora):\n\n${resetUrl}\n\nSi no solicitaste esto, ignora este mensaje.`,
        html: `
          <p>Usa el siguiente enlace para restablecer tu contraseña (válido por 1 hora):</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Si no solicitaste esto, ignora este mensaje.</p>
        `,
      });
    } catch {
      // Loguear pero no exponer al usuario
      console.error("Error enviando email de reset de contraseña");
    }
  }

  redirect("/auth/forgot-password?estado=sent");
}
