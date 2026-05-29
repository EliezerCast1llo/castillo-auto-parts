import { Resend } from "resend";
import type { EmailProvider } from "./provider";

function createResendProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;

  return {
    name: "resend",
    async sendEmail(message) {
      if (!apiKey) {
        throw new Error("RESEND_API_KEY no configurada.");
      }

      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      if (result.error) {
        throw new Error(`Resend error: ${result.error.message}`);
      }

      return { provider: "resend", status: "SENT", externalId: result.data?.id };
    },
  };
}

export const resendEmailProvider = createResendProvider();
