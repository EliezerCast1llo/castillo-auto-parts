export type InvoiceStatus = "PENDING" | "PENDING_MANUAL" | "ISSUED" | "FAILED" | "VOIDED";

export type CreateInvoiceInput = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  taxCents: number;
};

export type CreateInvoiceResult = {
  status: InvoiceStatus;
  externalInvoiceId?: string;
  message?: string;
};

export interface InvoiceProvider {
  createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult>;
}

