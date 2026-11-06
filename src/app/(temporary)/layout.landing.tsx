import type { Metadata } from "next";
import { Overpass } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { GoogleAdsTag } from "@/components/analytics/google-ads-tag";
import { landingSiteUrl } from "@/lib/landing-site-url";
import "./landing.css";

/**
 * Overpass está dibujada a partir del lettering vial de la FHWA, que es el
 * mundo de esta página. Se sirve desde el propio origen —`next/font` la
 * descarga al compilar— porque esta landing no hace pedidos externos salvo la
 * etiqueta de anuncios opcional.
 */
export const overpass = Overpass({
  subsets: ["latin"],
  variable: "--sign-face",
  weight: ["400", "600", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "es", namespace: "Landing" });
  const site = landingSiteUrl();

  return {
    // El título es el campo más fuerte para que esto aparezca en un buscador o
    // en un asistente, y solo con el nombre no dice ni el rubro ni el país.
    title: `${t("brand")} — Repuestos automotrices en El Salvador`,
    description: t("description"),
    robots: { index: true, follow: true },
    // Le dice al buscador que hay dos versiones y cuál corresponde a quién.
    alternates: {
      canonical: `${site}/`,
      languages: { es: `${site}/`, en: `${site}/en`, "x-default": `${site}/` },
    },
    openGraph: {
      title: `${t("brand")} — Repuestos automotrices en El Salvador`,
      description: t("description"),
      siteName: t("brand"),
      // Sin esto, el enlace pegado en WhatsApp —el único canal al que esta
      // página empuja— se ve como un enlace pelado.
      images: [{ url: `${site}/og.png`, width: 1200, height: 630, alt: t("brand") }],
      locale: "es_SV",
      type: "website",
      url: `${site}/`,
    },
  };
}

export default function TemporaryLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={overpass.variable}>
      <body>
        {children}
        <GoogleAdsTag />
      </body>
    </html>
  );
}
