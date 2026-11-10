import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { KeyRound } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { firstValue } from "@/lib/url-utils";
import { requestPasswordReset } from "./actions";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth.forgotPassword" });

  return {
    robots: { follow: false, index: false },
    title: t("metadataTitle"),
  };
}

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({
  params: routeParams,
  searchParams,
}: ForgotPasswordPageProps) {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const t = await getTranslations({ locale, namespace: "Auth.forgotPassword" });
  const params = searchParams ? await searchParams : {};
  const estado = firstValue(params.estado);
  const sent = estado === "sent";
  const rateLimited = estado === "rate_limited";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={locale} />

      <section className="ca-container flex py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-ca-control bg-primary text-white">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{t("eyebrow")}</p>
              <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
            </div>
          </div>

          {sent ? (
            <div className="mt-6 rounded-ca-control bg-ca-surface p-4 text-sm font-semibold text-success">
              {t("sent")}
            </div>
          ) : rateLimited ? (
            <div className="mt-6 rounded-ca-control bg-destructive/10 p-4 text-sm font-semibold text-destructive">
              {t("rateLimited")}
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                {t("description")}
              </p>

              <form action={requestPasswordReset} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold">
                  {t("email")}
                  <input
                    name="email"
                    required
                    type="email"
                    autoComplete="email"
                    className="mt-2 h-11 w-full rounded-ca-control border border-border bg-background px-3 text-sm focus:border-primary"
                  />
                </label>

                <button
                  type="submit"
                  className={buttonVariants({ className: "w-full" })}
                >
                  {t("submit")}
                </button>
              </form>
            </>
          )}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
