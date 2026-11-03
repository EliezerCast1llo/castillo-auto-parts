import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoogleAdsPurchase } from "./google-ads-purchase";

const purchase: GoogleAdsPurchase = {
  adsId: "AW-123", label: "purchase-label", orderNumber: "CAP-TEST-1",
  totalCents: 12945, paymentStatus: "PAID",
};

beforeEach(() => vi.resetModules());

describe("Google Ads purchase conversion", () => {
  it("sends only the approved order number and real USD total including shipping, once per session", async () => {
    const storage = new Map<string, string>();
    const session = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); } };
    const gtag = vi.fn();
    const { sendGoogleAdsPurchase } = await import("./google-ads-purchase");
    sendGoogleAdsPurchase(purchase, gtag, session);
    sendGoogleAdsPurchase(purchase, gtag, session);
    vi.resetModules(); // A new document/reload still shares sessionStorage.
    const reloaded = await import("./google-ads-purchase");
    reloaded.sendGoogleAdsPurchase(purchase, gtag, session);
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "conversion", {
      send_to: "AW-123/purchase-label", value: 129.45, currency: "USD", transaction_id: "CAP-TEST-1",
    });
  });

  it.each([undefined, "PENDING", "FAILED", "CANCELLED", "REFUNDED"])("does not track payment status %s", async (paymentStatus) => {
    const { sendGoogleAdsPurchase } = await import("./google-ads-purchase");
    const gtag = vi.fn();
    sendGoogleAdsPurchase({ ...purchase, paymentStatus }, gtag);
    expect(gtag).not.toHaveBeenCalled();
  });

  it.each([{ adsId: "" }, { adsId: undefined }, { label: " " }, { label: undefined },
    { totalCents: NaN }, { totalCents: -1 }, { totalCents: 1.5 }])("ignores absent configuration or invalid totals: %j", async (override) => {
    const { sendGoogleAdsPurchase } = await import("./google-ads-purchase");
    const gtag = vi.fn();
    sendGoogleAdsPurchase({ ...purchase, ...override }, gtag);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("never breaks the order when storage is denied, and deduplicates in this document", async () => {
    const { sendGoogleAdsPurchase } = await import("./google-ads-purchase");
    const blocked = { getItem: () => { throw Error("denied"); }, setItem: () => { throw Error("denied"); } };
    const gtag = vi.fn();
    expect(() => {
      sendGoogleAdsPurchase(purchase, gtag, blocked);
      sendGoogleAdsPurchase(purchase, gtag, blocked);
    }).not.toThrow();
    expect(gtag).toHaveBeenCalledTimes(1);
  });
});
