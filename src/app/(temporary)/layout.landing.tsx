import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import "./landing.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "es", namespace: "Landing" });
  return { title: t("brand"), description: t("description"), robots: { index: true, follow: true } };
}

export default function TemporaryLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
