import { headers } from "next/headers";
import NotFoundContent from "@/components/not-found-content";
import { loadMessages } from "@/lib/i18n/messages";
import "./globals.css";

async function localeForNotFound() {
  return (await headers()).get("x-route-locale") === "en" ? "en" : "es";
}

export async function generateMetadata() {
  const locale = await localeForNotFound();
  return { title: `${loadMessages(locale).Errors.notFound.title} | Castillo Auto Parts`, robots: { index: false, follow: false } };
}

export default async function GlobalNotFound() {
  const locale = await localeForNotFound();
  return <html lang={locale}><body><NotFoundContent locale={locale} /></body></html>;
}
