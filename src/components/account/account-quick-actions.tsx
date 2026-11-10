import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { ChevronRight, ClipboardList, MapPin } from "lucide-react";
import type { LocaleHref } from "@/lib/i18n/navigation";

type AccountQuickActionsProps = {
  addressesCount?: number;
  locale: Locale;
  ordersCount?: number;
};

export async function AccountQuickActions({
  addressesCount,
  locale,
  ordersCount,
}: AccountQuickActionsProps) {
  const t = await getTranslations({ locale, namespace: "Account.quickActions" });

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <QuickActionCard
        count={
          typeof ordersCount === "number"
            ? t("ordersCount", { count: ordersCount })
            : undefined
        }
        description={t("ordersDescription")}
        href="/account/orders"
        icon={<ClipboardList className="h-6 w-6" strokeWidth={1.8} />}
        label={t("ordersLabel")}
      />
      <QuickActionCard
        count={
          typeof addressesCount === "number"
            ? t("addressesCount", { count: addressesCount })
            : undefined
        }
        description={t("addressesDescription")}
        href="/account/addresses"
        icon={<MapPin className="h-6 w-6" strokeWidth={1.8} />}
        label={t("addressesLabel")}
      />
    </section>
  );
}

function QuickActionCard({
  count,
  description,
  href,
  icon,
  label,
}: {
  count?: string;
  description: string;
  href: LocaleHref;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      aria-label={label}
      className="group flex min-h-32 items-center gap-4 rounded-ca-surface border border-ca-border bg-ca-surface p-5 transition hover:border-ca-navy/30"
      href={href}
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-ca-control bg-ca-bg text-ca-navy transition group-hover:bg-ca-navy group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-bold text-ca-navy">{label}</span>
        <span className="mt-1 block max-w-sm text-sm font-semibold leading-6 text-ca-text-secondary">
          {description}
        </span>
        {count ? (
          <span className="mt-2 inline-flex rounded-ca-control bg-ca-bg px-2.5 py-1 text-xs font-bold text-ca-text-secondary">
            {count}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-ca-navy transition group-hover:translate-x-1"
        strokeWidth={2.2}
      />
    </Link>
  );
}


