export type EmailMessage = {
  from: string;
  html: string;
  subject: string;
  text: string;
  to: string;
};

export type SendEmailResult = {
  externalId?: string;
  provider: string;
  status: "SENT";
};

export type EmailProvider = {
  name: string;
  sendEmail(message: EmailMessage): Promise<SendEmailResult>;
};
