import { notFound } from "next/navigation";
import { KeyRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { verifyPasswordResetToken } from "@/lib/auth-user";
import { firstValue } from "@/lib/url-utils";
import { applyPasswordResetAction } from "./actions";
import { getStatusMessage } from "@/lib/i18n/status";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth.resetPassword" });

  return {
    robots: { follow: false, index: false },
    title: t("metadataTitle"),
  };
}

type ResetPasswordPageProps = {
  params: Promise<{ locale: string; token: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth.resetPassword" });
  const { token } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const errorMessage = await getStatusMessage("auth", firstValue(queryParams.estado), locale);

  const record = await verifyPasswordResetToken(token);
  if (!record) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={locale} />

      <section className="mx-auto flex max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{t("eyebrow")}</p>
              <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
              {errorMessage}
            </div>
          ) : null}

          <form action={applyPasswordResetAction} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />

            <label className="block text-sm font-semibold">
              {t("newPassword")}
              <input
                name="password"
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block text-sm font-semibold">
              {t("confirmPassword")}
              <input
                name="passwordConfirm"
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>

            <p className="text-xs text-muted-foreground">{t("minLength")}</p>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
            >
              {t("submit")}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

