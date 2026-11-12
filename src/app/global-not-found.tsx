import { headers } from "next/headers";
import NotFoundContent from "@/components/not-found-content";
import "./globals.css";

export default async function GlobalNotFound() {
  const locale = (await headers()).get("x-route-locale") === "en" ? "en" : "es";
  return <html lang={locale}><head><title>{locale === "en" ? "Page not found" : "Página no encontrada"} | Castillo Auto Parts</title></head><body><NotFoundContent locale={locale} /></body></html>;
}
