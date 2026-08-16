import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, MapPin } from "lucide-react";

type AccountQuickActionsProps = {
  addressesCount?: number;
  ordersCount?: number;
};

export function AccountQuickActions({
  addressesCount,
  ordersCount,
}: AccountQuickActionsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <QuickActionCard
        count={formatOrdersCount(ordersCount)}
        description="Consulta el estado e historial de tus compras."
        href="/account/orders"
        icon={<ClipboardList className="h-6 w-6" strokeWidth={1.8} />}
        label="Mis pedidos"
      />
      <QuickActionCard
        count={formatAddressesCount(addressesCount)}
        description="Administra tus direcciones de entrega."
        href="/account/addresses"
        icon={<MapPin className="h-6 w-6" strokeWidth={1.8} />}
        label="Mis direcciones"
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
  href: string;
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

function formatOrdersCount(value: number | undefined) {
  if (typeof value !== "number") return undefined;
  if (value === 1) return "1 pedido";
  return `${value} pedidos`;
}

function formatAddressesCount(value: number | undefined) {
  if (typeof value !== "number") return undefined;
  if (value === 1) return "1 dirección";
  return `${value} direcciones`;
}
