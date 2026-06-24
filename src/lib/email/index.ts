import { consoleEmailProvider } from "./console-provider";
import { resendEmailProvider } from "./resend-provider";
import type { EmailProvider } from "./provider";

export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "console";

  if (provider === "resend") {
    return resendEmailProvider;
  }

  if (provider === "console") {
    if (canUseConsoleEmailProvider()) {
      return consoleEmailProvider;
    }

    throw new Error("EMAIL_PROVIDER=console no está permitido en producción.");
  }

  throw new Error(`EMAIL_PROVIDER inválido: ${provider}. Usa "resend" o "console".`);
}

export function getTransactionalEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || "Castillo Auto Parts <no-reply@castilloautoparts.local>";
}

function canUseConsoleEmailProvider() {
  return process.env.NODE_ENV !== "production" || process.env.E2E_ISOLATED_DATABASE === "true";
}
