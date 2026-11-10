import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";

const colors = ["bg", "surface", "border", "text", "text-secondary", "navy", "navy-hover", "accent", "success", "warning", "danger", "whatsapp"] as const;
const scale = [
  ["12", "text-xs"],
  ["14", "text-sm"],
  ["16", "text-base"],
  ["20", "text-xl"],
  ["24", "text-2xl"],
  ["32", "text-ca-title"],
] as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Design" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function DesignPage({ params }: Props) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Design" });

  return (
    <main className="min-h-screen bg-ca-bg text-ca-text">
      <SiteHeader locale={locale} />
      <div className="ca-container space-y-4 py-8">
        <header className="mb-8">
          <h1 className="text-ca-title font-bold text-ca-navy">{t("title")}</h1>
          <p className="mt-2 text-ca-text-secondary">{t("description")}</p>
        </header>
        <Card>
          <h2 className="text-xl font-bold">{t("palette")}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {colors.map((color) => (
              <li key={color}>
                <div className="h-12 rounded-ca-surface border border-ca-border" style={{ backgroundColor: `var(--ca-${color})` }} />
                <code className="mt-2 block text-xs text-ca-text-secondary">{`--ca-${color}`}</code>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">{t("typography")}</h2>
          <p className="mt-2 text-sm text-ca-text-secondary">Outfit · 400 {t("normal")} · 600 {t("semibold")} · 700 {t("bold")}</p>
          <ul className="mt-4 space-y-2">
            {scale.map(([size, className]) => (
              <li className="flex items-baseline gap-4" key={size}>
                <code className="w-12 shrink-0 text-xs text-ca-text-secondary">{size} px</code>
                <span className={className}>{t("textSample")}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">{t("radii")}</h2>
          <dl className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="rounded-ca-control border border-ca-border bg-ca-bg p-4"><dt>{t("control")}</dt><dd>4 px</dd></div>
            <div className="rounded-ca-surface border border-ca-border bg-ca-bg p-4"><dt>{t("surface")}</dt><dd>6 px</dd></div>
            <div className="flex items-center gap-2"><dt>{t("counter")}</dt><dd className="rounded-ca-pill bg-ca-accent px-2 py-1 font-bold">3</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">{t("buttons")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button>{t("primary")}</Button>
            <Button variant="outline">{t("outline")}</Button>
            <Button disabled>{t("primary")}</Button>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">{t("overlays")}</h2>
          <details className="relative mt-4">
            <summary className={buttonVariants({ variant: "outline" })}>{t("overlayExample")}</summary>
            <p className="absolute bottom-full left-0 mb-2 w-full max-w-xs rounded-ca-surface border border-ca-border bg-ca-surface p-4 text-sm shadow-ca-overlay">
              {t("overlayDescription")}
            </p>
          </details>
        </Card>
      </div>
    </main>
  );
}
