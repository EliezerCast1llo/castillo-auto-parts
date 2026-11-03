import { consoleEmailProvider } from "./console-provider";
import { isIsolatedE2EEnvironment } from "../production-environment";
import { resendEmailProvider } from "./resend-provider";
import type { EmailProvider } from "./provider";
import { OperationalError } from "../operational-error";

export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "console";

  if (provider === "resend") {
    return resendEmailProvider;
  }

  if (provider === "console") {
    if (canUseConsoleEmailProvider()) {
      return consoleEmailProvider;
    }

    throw new OperationalError("CONFIG_INVALID", "EMAIL_PROVIDER=console no está permitido en producción.");
  }

  throw new OperationalError("CONFIG_INVALID", 'EMAIL_PROVIDER inválido. Usa "resend" o "console".');
}

export function getTransactionalEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || "Castillo Auto Parts <no-reply@castilloautoparts.local>";
}

function canUseConsoleEmailProvider() {
  return process.env.NODE_ENV !== "production" || isIsolatedE2EEnvironment();
}
