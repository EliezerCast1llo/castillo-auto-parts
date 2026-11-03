import { headers } from "next/headers";
import Script from "next/script";

/** Shared by both root layouts; no store, payment or database imports. */
export async function GoogleAdsTag() {
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim();
  if (!adsId) return null;

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  // Escape '<' as well as JS quotes so an environment value cannot close the script tag.
  const serializedId = JSON.stringify(adsId).replace(/</g, "\\u003c");

  return (
    <>
      <Script
        id="google-ads-tag"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`}
        strategy="afterInteractive"
        nonce={nonce}
      />
      <Script id="google-ads-config" strategy="afterInteractive" nonce={nonce}>
        {`window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());
window.gtag('config', ${serializedId}, {
  page_location: window.location.origin + window.location.pathname,
  page_referrer: document.referrer.split(/[?#]/)[0]
});
window.googleAdsConfigured = true;
window.dispatchEvent(new Event('google-ads-ready'));`}
      </Script>
    </>
  );
}
