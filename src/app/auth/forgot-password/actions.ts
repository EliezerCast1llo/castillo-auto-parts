"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getEmailProvider, getTransactionalEmailFrom } from "@/lib/email";
import { logError } from "@/lib/logger";
import { formString } from "@/lib/form-utils";
import { createPasswordResetToken } from "@/lib/auth-user";
import { createForgotPasswordRateLimiter } from "@/lib/rate-limit-redis";

const forgotPasswordRateLimiter = createForgotPasswordRateLimiter();

export async function requestPasswordReset(formData: FormData) {
  const email = formString(formData, "email").trim().toLowerCase();

  if (!email) {
    redirect("/auth/forgot-password?estado=missing_email");
  }

  // Rate limit por IP y por email objetivo (previene email bombing)
  const ipKey = await getForgotPasswordIpKey();
  const emailKey = `forgot-password:email:${email}`;

  const [ipCheck, emailCheck] = await Promise.all([
    forgotPasswordRateLimiter.check(ipKey),
    forgotPasswordRateLimiter.check(emailKey),
  ]);

  if (!ipCheck.allowed || !emailCheck.allowed) {
    redirect("/auth/forgot-password?estado=rate_limited");
  }

  // Registrar el intento en ambas claves independientemente del resultado
  // (no revelamos si el email existe; el rate limit aplica igual)
  const [ipAttempt, emailAttempt] = await Promise.all([
    forgotPasswordRateLimiter.registerFailure(ipKey),
    forgotPasswordRateLimiter.registerFailure(emailKey),
  ]);

  if (!ipAttempt.allowed || !emailAttempt.allowed) {
    redirect("/auth/forgot-password?estado=rate_limited");
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
    } catch (error) {
      logError({ context: "sendPasswordResetEmail" }, error);
    }
  }

  redirect("/auth/forgot-password?estado=sent");
}

async function getForgotPasswordIpKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip")?.trim();
  return `forgot-password:ip:${ip ?? "local"}`;
}
