export type GoogleAdsPurchase = {
  adsId: string | undefined;
  label: string | undefined;
  orderNumber: string;
  totalCents: number;
  paymentStatus: string | undefined;
};

type Conversion = {
  send_to: string;
  value: number;
  currency: "USD";
  transaction_id: string;
};

export type GoogleAdsEvent = (command: "event", name: "conversion", payload: Conversion) => void;

// Fallback when sessionStorage is denied; also prevents duplicate effects in StrictMode.
const sentInDocument = new Set<string>();

export function sendGoogleAdsPurchase(
  purchase: GoogleAdsPurchase,
  gtag: GoogleAdsEvent,
  storage?: Pick<Storage, "getItem" | "setItem">,
) {
  const adsId = purchase.adsId?.trim();
  const label = purchase.label?.trim();
  if (!adsId || !label || purchase.paymentStatus !== "PAID" || !purchase.orderNumber
    || !Number.isSafeInteger(purchase.totalCents) || purchase.totalCents < 0) return;

  const key = `google-ads:purchase:${adsId}/${label}:${purchase.orderNumber}`;
  if (sentInDocument.has(key)) return;
  try { if (storage?.getItem(key)) return; } catch { /* Tracking never blocks an order. */ }

  gtag("event", "conversion", {
    send_to: `${adsId}/${label}`,
    value: purchase.totalCents / 100,
    currency: "USD",
    transaction_id: purchase.orderNumber,
  });
  sentInDocument.add(key);
  try { storage?.setItem(key, "1"); } catch { /* Use the per-document fallback. */ }
}
