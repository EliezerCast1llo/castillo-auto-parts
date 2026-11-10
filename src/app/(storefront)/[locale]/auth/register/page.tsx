import { UserPlus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/lib/auth";
import { getSafeCustomerNextPath } from "@/lib/auth-paths";
import { firstValue } from "@/lib/url-utils";
import { asLocaleHref, redirect } from "@/lib/i18n/navigation";
import { getStatusMessage } from "@/lib/i18n/status";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth.register" });

  return {
    robots: { follow: false, index: false },
    title: t("metadataTitle"),
  };
}

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ params: routeParams, searchParams }: RegisterPageProps) {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const session = await auth();
  const params = searchParams ? await searchParams : {};
  const nextPath = getSafeCustomerNextPath(firstValue(params.next));
  const errorMessage = await getStatusMessage("auth", firstValue(params.estado), locale);

  const t = await getTranslations({ locale, namespace: "Auth.register" });

  if (session?.user) redirect({ href: asLocaleHref(nextPath), locale });

  return (
    <main className="min-h-screen bg-ca-bg text-ca-text">
      <SiteHeader locale={locale} />

      <section className="ca-container flex py-10">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-ca-control bg-ca-navy text-white">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-ca-text-secondary">{t("eyebrow")}</p>
              <h1 className="text-2xl font-bold text-ca-navy">{t("metadataTitle")}</h1>
            </div>
          </div>

          <div className="mt-6 rounded-ca-surface border border-ca-border bg-ca-surface p-6">
            <RegisterForm nextPath={nextPath} errorMessage={errorMessage} />
          </div>
        </div>
      </section>
    </main>
  );
}

