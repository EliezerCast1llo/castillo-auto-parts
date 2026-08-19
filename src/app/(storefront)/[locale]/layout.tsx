import type { Metadata } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ToastProvider } from "@/components/ui/toast";
import { defaultLocale, locales } from "@/lib/i18n/config";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "../../globals.css";

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
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_SV",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

/**
 * Root layout del storefront. El panel `/admin` tiene el suyo en `(admin)`.
 *
 * A propósito **no** llama `notFound()` para validar el locale: hacerlo desde
 * un root layout hace que Next sirva el shell `__next_error__`, sin `lang` y
 * sin hoja de estilos. El middleware garantiza que solo lleguen locales
 * válidos; acá alcanza con un fallback defensivo para el atributo `lang`.
 */
export default async function StorefrontLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(locales, requestedLocale) ? requestedLocale : defaultLocale;

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body className={`${barlowCondensed.variable} ${outfit.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale}>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
