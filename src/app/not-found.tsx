import { headers } from "next/headers";
import NotFoundContent from "@/components/not-found-content";

export const metadata = { title: "404 | Castillo Auto Parts" };

export default async function NotFound() {
  const locale = (await headers()).get("x-route-locale");
  return <NotFoundContent locale={locale === "en" ? "en" : "es"} />;
}
