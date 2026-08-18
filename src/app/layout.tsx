import type { Metadata } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Barlow Condensed es estatica: cada peso declarado es un .woff2 aparte que
// next/font ademas precarga. Solo se usa en 800 (.ca-section-label, rieles,
// selector de vehiculo) y 900 (h1 del hero, logo, titulos de error), asi que
// declarar 400/600/700 anadia tres descargas y tres <link rel=preload> que
// competian con la imagen LCP del hero sin pintar un solo caracter.
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["800", "900"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${barlowCondensed.variable} ${outfit.variable} font-sans antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
