import { Link, redirect } from "@/lib/i18n/navigation";
import { Home } from "lucide-react";
import { AccountOverviewHeader } from "@/components/account/account-overview-header";
import { AccountPasswordForm } from "@/components/account/account-password-form";
import { AccountProfileForm } from "@/components/account/account-profile-form";
import { AccountQuickActions } from "@/components/account/account-quick-actions";
import { AccountSupportCard } from "@/components/account/account-support-card";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { firstValue } from "@/lib/url-utils";
import { changePasswordAction, logoutCustomer, updateProfileAction } from "./actions";

import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getStatusMessage } from "@/lib/i18n/status";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Account" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    robots: { index: false, follow: false },
  };
}

type AccountPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPage({
  params: routeParams,
  searchParams,
}: AccountPageProps) {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const t = await getTranslations({ locale, namespace: "Account" });
  const session = await auth();
  if (!session?.user?.id) {
    return redirect({ href: { pathname: "/auth/login", query: { next: "/account" } }, locale });
  }

  const params = searchParams ? await searchParams : {};
  const estado = firstValue(params.estado);
  const [statusMessage, errorMessage] = await Promise.all([
    getStatusMessage("account.success", estado, locale),
    getStatusMessage("account.error", estado, locale),
  ]);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      _count: {
        select: {
          addresses: true,
          orders: true,
        },
      },
      createdAt: true,
      email: true,
      image: true,
      isActive: true,
      name: true,
      passwordHash: true,
      phone: true,
    },
  });

  if (!user) {
    return redirect({ href: { pathname: "/auth/login", query: { next: "/account" } }, locale });
  }

  const hasPassword = Boolean(user.passwordHash);

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader locale={locale} />

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <nav aria-label={t("breadcrumbAriaLabel")} className="mb-5 flex items-center gap-2 text-sm font-bold text-ca-text-secondary">
          <Link className="inline-flex items-center gap-1.5 transition hover:text-ca-navy-950" href="/">
            <Home className="h-4 w-4" strokeWidth={1.8} />
            {t("breadcrumbHome")}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ca-navy-950">{t("breadcrumbCurrent")}</span>
        </nav>

        <div className="space-y-5">
          <AccountOverviewHeader
            createdAt={user.createdAt}
            email={user.email}
            hasPassword={hasPassword}
            image={user.image}
            isActive={user.isActive}
            locale={locale}
            logoutAction={logoutCustomer}
            name={user.name}
          />

          <AccountQuickActions
            addressesCount={user._count.addresses}
            locale={locale}
            ordersCount={user._count.orders}
          />

          <AccountNotice errorMessage={errorMessage} statusMessage={statusMessage} />

          <div className="grid items-stretch gap-5 lg:grid-cols-2">
            <div className="min-w-0">
              <AccountProfileForm
                action={updateProfileAction}
                email={user.email}
                locale={locale}
                name={user.name}
                phone={user.phone}
              />
            </div>

            <div className="min-w-0">
              <AccountPasswordForm
                action={changePasswordAction}
                hasPassword={hasPassword}
                locale={locale}
              />
            </div>

            <div className="lg:col-span-2">
              <AccountSupportCard locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function AccountNotice({
  errorMessage,
  statusMessage,
}: {
  errorMessage: string;
  statusMessage: string;
}) {
  if (!statusMessage && !errorMessage) return null;

  if (statusMessage) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 shadow-[0_8px_20px_rgba(22,128,58,0.08)]">
        {statusMessage}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 shadow-[0_8px_20px_rgba(180,35,24,0.08)]">
      {errorMessage}
    </div>
  );
}

