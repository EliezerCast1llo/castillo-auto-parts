import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GoogleAdsTag } from "@/components/analytics/google-ads-tag";
import { landingSiteUrl } from "@/lib/landing-site-url";
import { overpass } from "../(temporary)/layout.landing";
import "../(temporary)/landing.css";

/**
 * Segunda raíz, para que `/en` pueda declarar su propio `lang`.
 *
 * `<html>` lo renderiza la raíz, y una raíz no conoce la ruta que la cuelga,
 * así que la única forma de que el idioma del documento siga al del contenido
 * es que cada idioma tenga la suya. Con el idioma clavado, un lector de
 * pantalla pronunciaría el inglés con fonética española.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "en", namespace: "Landing" });
  const site = landingSiteUrl();

  return {
    // El título es el campo más fuerte para que esto aparezca en un buscador o
    // en un asistente, y solo con el nombre no dice ni el rubro ni el país.
    title: `${t("brand")} — Auto parts in El Salvador`,
    description: t("description"),
    robots: { index: true, follow: true },
    alternates: {
      canonical: `${site}/en`,
      languages: { es: `${site}/`, en: `${site}/en`, "x-default": `${site}/` },
    },
    openGraph: {
      title: `${t("brand")} — Auto parts in El Salvador`,
      description: t("description"),
      siteName: t("brand"),
      // Sin esto, el enlace pegado en WhatsApp —el único canal al que esta
      // página empuja— se ve como un enlace pelado.
      images: [{ url: `${site}/og.png`, width: 1200, height: 630, alt: t("brand") }],
      locale: "en_US",
      type: "website",
      url: `${site}/en`,
    },
  };
}

export default function TemporaryEnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={overpass.variable}>
      <body>
        {children}
        <GoogleAdsTag />
      </body>
    </html>
  );
}
