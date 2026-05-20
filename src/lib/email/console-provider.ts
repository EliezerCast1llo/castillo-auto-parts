import type { EmailMessage, EmailProvider } from "./provider";

export const consoleEmailProvider: EmailProvider = {
  name: "console",

  async sendEmail(message: EmailMessage) {
    const externalId = `console-${Date.now()}`;

    if (process.env.NODE_ENV !== "test") {
      console.info("Transactional email simulated", {
        externalId,
        subject: message.subject,
        to: message.to,
      });
    }

    return {
      externalId,
      provider: "console",
      status: "SENT",
    };
  },
};
