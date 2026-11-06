import { Resend } from "resend";
import type { EmailProvider } from "./provider";
import { OperationalError, providerFailure } from "../operational-error";

function createResendProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;

  return {
    name: "resend",
    async sendEmail(message) {
      if (!apiKey) {
        throw new OperationalError("CONFIG_MISSING", "RESEND_API_KEY no configurada.");
      }

      try {
        const resend = new Resend(apiKey);
        const result = await resend.emails.send({
          from: message.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }, { idempotencyKey: message.idempotencyKey, ...(message.signal ? { signal: message.signal } : {}) });

        if (result.error) {
          const status = result.error.statusCode;
          throw new OperationalError(status && status >= 500 ? "PROVIDER_UNAVAILABLE" : "PROVIDER_REJECTED", "Resend could not send email.");
        }

        return { provider: "resend", status: "SENT", externalId: result.data?.id };
      } catch (error) { throw providerFailure(error, "Resend request unavailable."); }
    },
  };
}

export const resendEmailProvider = createResendProvider();
