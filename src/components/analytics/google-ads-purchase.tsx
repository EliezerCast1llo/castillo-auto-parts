"use client";

import { useEffect } from "react";
import { sendGoogleAdsPurchase, type GoogleAdsEvent } from "@/lib/google-ads-purchase";

declare global {
  interface Window {
    googleAdsConfigured?: boolean;
    gtag?: GoogleAdsEvent;
  }
}

export function GoogleAdsPurchase({ orderNumber, totalCents }: {
  orderNumber: string;
  totalCents: number;
}) {
  useEffect(() => {
    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;
    if (!adsId?.trim() || !label?.trim()) return;

    const send = () => {
      // Config queues before conversion, even if this component hydrates first.
      if (!window.googleAdsConfigured || !window.gtag) return;
      let storage: Storage | undefined;
      try { storage = window.sessionStorage; } catch { /* Storage can be disabled. */ }
      sendGoogleAdsPurchase({ adsId, label, orderNumber, totalCents, paymentStatus: "PAID" }, window.gtag, storage);
    };
    window.addEventListener("google-ads-ready", send);
    send();
    return () => window.removeEventListener("google-ads-ready", send);
  }, [orderNumber, totalCents]);

  return null;
}
