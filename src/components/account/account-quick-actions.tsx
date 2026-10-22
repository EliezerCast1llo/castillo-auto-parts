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
      className="group flex min-h-32 items-center gap-4 rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)] transition hover:-translate-y-0.5 hover:border-ca-navy-950/30 hover:shadow-[var(--ca-shadow-premium)]"
      href={href}
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ca-background text-ca-navy-950 transition group-hover:bg-ca-navy-950 group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-black text-ca-navy-950">{label}</span>
        <span className="mt-1 block max-w-sm text-sm font-medium leading-6 text-ca-text-secondary">
          {description}
        </span>
        {count ? (
          <span className="mt-2 inline-flex rounded-full bg-ca-background px-2.5 py-1 text-xs font-black text-ca-text-secondary">
            {count}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-ca-navy-950 transition group-hover:translate-x-1"
        strokeWidth={2.2}
      />
    </Link>
  );
}


