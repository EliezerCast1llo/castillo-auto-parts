import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GoogleAdsTag } from "@/components/analytics/google-ads-tag";
import { resolveLandingLocale } from "./landing-locale";
import "./landing.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLandingLocale();
  const t = await getTranslations({ locale, namespace: "Landing" });
  return { title: t("brand"), description: t("description"), robots: { index: true, follow: true } };
}

/**
 * `lang` sale de la misma fuente que el texto. Con el idioma clavado en "es",
 * la versión en inglés se anunciaba como española: un lector de pantalla la
 * pronunciaría con fonética equivocada.
 */
export default async function TemporaryLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveLandingLocale();

  return <html lang={locale}><body>{children}<GoogleAdsTag /></body></html>;
}
