import type { Metadata } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ToastProvider } from "@/components/ui/toast";
import { defaultLocale } from "@/lib/i18n/config";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "../globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-display",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Admin | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  robots: { index: false, follow: false },
};

/**
 * Root layout del panel admin.
 *
 * El admin es interno y queda fuera del alcance de la internacionalización:
 * vive sin prefijo de idioma y siempre en español.
 *
 * Aun así monta next-intl fijado a español porque reutiliza componentes del
 * storefront —`SiteHeader` entre ellos— que navegan con el `Link` con prefijo
 * de idioma y necesitan un locale resuelto. Fijarlo acá, en vez de dejar que
 * caiga a la cookie, hace que los enlaces del header del admin apunten siempre
 * al storefront en español.
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  setRequestLocale(defaultLocale);

  return (
    <html lang="es">
      <body className={`${barlowCondensed.variable} ${outfit.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={defaultLocale}>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
