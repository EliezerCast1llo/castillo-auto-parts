import { buttonVariants } from "@/components/ui/button";
import { Link, redirect } from "@/lib/i18n/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Headphones,
  PackageSearch,
  Phone,
} from "lucide-react";
import {
  AccountOrderCard,
  accountOrderCardInclude,
} from "@/components/account/account-order-card";
import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { auth } from "@/lib/auth";
import { SUPPORT_WHATSAPP_NUMBER, buildContactLinks } from "@/lib/contact";
import { db } from "@/lib/db";

import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Orders.list" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    robots: { index: false, follow: false },
  };
}

type OrdersListTranslator = Awaited<ReturnType<typeof getTranslations<"Orders.list">>>;

export default async function AccountOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Orders.list" });
  const session = await auth();
  if (!session?.user?.id) {
    return redirect({ href: { pathname: "/auth/login", query: { next: "/account/orders" } }, locale });
  }

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: accountOrderCardInclude,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-ca-bg text-ca-text">
      <SiteHeader locale={locale} />

      <div className="ca-container py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-ca-navy transition hover:text-ca-navy-hover"
              href="/account"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              {t("backToAccount")}
            </Link>

            <h1 className="mt-4 text-ca-title font-bold tracking-tight text-ca-navy sm:text-ca-title">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-semibold text-ca-text-secondary">
              {t("subtitle")}
            </p>
          </div>

          <button
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
            type="button"
          >
            <CalendarDays className="h-4 w-4" strokeWidth={1.9} />
            {t("lastSixMonths")}
            <ChevronDown className="h-4 w-4" strokeWidth={1.9} />
          </button>
        </div>

        {orders.length === 0 ? (
          <EmptyOrders t={t} />
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <AccountOrderCard key={order.id} locale={locale} order={order} />
            ))}
          </div>
        )}

        <OrderHelpCard t={t} />
      </div>
    </main>
  );
}

function EmptyOrders({ t }: { t: OrdersListTranslator }) {
  return (
    <div className="mt-8">
      <EmptyState
        actionHref="/catalog"
        actionLabel={t("emptyAction")}
        description={t("emptyDescription")}
        icon={<PackageSearch className="h-7 w-7" strokeWidth={1.8} />}
        showWhatsApp
        title={t("emptyTitle")}
      />
    </div>
  );
}

function OrderHelpCard({ t }: { t: OrdersListTranslator }) {
  return (
    <section className="mt-5 flex flex-col gap-4 rounded-ca-surface border border-ca-border bg-ca-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ca-control bg-ca-bg text-ca-navy">
          <Headphones className="h-7 w-7" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-base font-bold text-ca-navy">
            {t("helpTitle")}
          </h2>
          <p className="mt-1 text-sm font-semibold text-ca-text-secondary">
            {t("helpDescription")}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:flex sm:items-center">
        <WhatsAppCTA
          className="h-11 justify-center"
          label={t("contactAdvisor")}
          phone={SUPPORT_WHATSAPP_NUMBER}
          variant="subtle"
        />
        {SUPPORT_WHATSAPP_NUMBER ? (
          <a
            className={buttonVariants({ variant: "outline" })}
            href={buildContactLinks(SUPPORT_WHATSAPP_NUMBER).telephone}
          >
            <Phone className="h-4 w-4" strokeWidth={1.9} />
            +{SUPPORT_WHATSAPP_NUMBER}
          </a>
        ) : null}
      </div>
    </section>
  );
}
