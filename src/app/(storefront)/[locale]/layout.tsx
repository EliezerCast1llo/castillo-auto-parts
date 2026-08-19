import type { Metadata } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { CookieConsentSlot } from "@/components/consent/cookie-consent-slot";
import { ToastProvider } from "@/components/ui/toast";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { loadMessages, pickClientMessages } from "@/lib/i18n/messages";
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

/** Etiquetas OpenGraph por idioma. */
const OG_LOCALES: Record<Locale, string> = {
  es: "es_SV",
  en: "en_US",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(locales, requestedLocale) ? requestedLocale : defaultLocale;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    // Canonical al idioma actual, con hreflang hacia el otro: le dice al
    // buscador que son la misma pagina en dos idiomas y no contenido duplicado.
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(locales.map((item) => [item, `/${item}`])),
        "x-default": `/${defaultLocale}`,
      },
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALES[locale],
      alternateLocale: locales.filter((item) => item !== locale).map((item) => OG_LOCALES[item]),
      url: `${SITE_URL}/${locale}`,
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
}

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

  const messages = await loadMessages(locale);

  return (
    <html lang={locale}>
      <body className={`${barlowCondensed.variable} ${outfit.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={pickClientMessages(messages)}>
          <ToastProvider>{children}</ToastProvider>
          <CookieConsentSlot />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
