import { consoleEmailProvider } from "./console-provider";
import type { EmailProvider } from "./provider";

export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase() || "console";

  if (provider === "console" || provider === "mock") {
    return consoleEmailProvider;
  }

  return consoleEmailProvider;
}

export function getTransactionalEmailFrom() {
  return process.env.EMAIL_FROM?.trim() || "Castillo Auto Parts <no-reply@castilloautoparts.local>";
}
