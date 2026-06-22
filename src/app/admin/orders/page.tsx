import type { OrderStatus } from "@prisma/client";
import { ArrowRight, ClipboardList, PackageCheck } from "lucide-react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import {
  formatDateTime,
  formatOrderStatus,
  formatPaymentProvider,
  formatShipmentMethod,
  getOrderStatusClassName,
} from "@/lib/order-formatters";
import { firstValue } from "@/lib/url-utils";

export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const orderStatusOptions: OrderStatus[] = [
  "PAYMENT_PROCESSING",
  "PAID_PENDING_SHIPMENT",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const adminUser = await requireAdminRole("ADMIN", "SALES", "WAREHOUSE", "SUPPORT", "ACCOUNTING");

  const params = searchParams ? await searchParams : {};
  const status = parseOrderStatus(firstValue(params.estado));
  const orders = await db.order.findMany({
    include: {
      items: true,
      payment: true,
      shipment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    where: status ? { status } : undefined,
  });

  const counts = await db.order.groupBy({
    by: ["status"],
    _count: {
      status: true,
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-md border border-border bg-card p-5">
          <p className="text-sm font-semibold text-success">Admin protegido</p>
          <div className="mt-1 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-bold text-primary">Órdenes</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Revisa pagos en confirmación, compras pagadas y preparación de entrega.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <AdminNav active="orders" user={adminUser} />
              <StatusFilter selectedStatus={status} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          {orderStatusOptions.map((option) => (
            <MetricCard
              key={option}
              label={formatOrderStatus(option)}
              value={String(getStatusCount(counts, option))}
            />
          ))}
        </section>

        <section className="mt-5 rounded-md border border-border bg-card shadow-[0_16px_40px_rgba(18,50,74,0.08)]">
          <div className="flex items-center gap-2 border-b border-border p-5">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-primary">Últimas órdenes</h2>
          </div>

          {orders.length > 0 ? (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <article className="grid gap-4 p-5 lg:grid-cols-[1fr_180px_170px_140px]" key={order.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="text-lg font-bold text-primary"
                        href={`/admin/orders/${order.orderNumber}`}
                      >
                        {order.orderNumber}
                      </Link>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-2 text-sm font-semibold">{order.customerName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.customerEmail} · {order.customerPhone}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)} · {order.items.length} producto
                      {order.items.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <InfoBlock label="Entrega" value={formatShipmentMethod(order.shipment?.method)} />
                  <InfoBlock label="Pago" value={formatPaymentProvider(order.payment?.provider)} />
                  <div className="flex items-center justify-between gap-3 lg:block lg:text-right">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(order.totalCents)}</p>
                    </div>
                    <Link
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white"
                      href={`/admin/orders/${order.orderNumber}`}
                    >
                      Ver
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyOrders />
          )}
        </section>
      </div>
    </main>
  );
}

function StatusFilter({ selectedStatus }: { selectedStatus?: OrderStatus }) {
  return (
    <form className="grid gap-2 sm:grid-cols-[220px_110px]" method="GET">
      <label className="block text-sm font-semibold">
        Estado
        <select
          className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          defaultValue={selectedStatus ?? ""}
          name="estado"
        >
          <option value="">Todos</option>
          {orderStatusOptions.map((status) => (
            <option key={status} value={status}>
              {formatOrderStatus(status)}
            </option>
          ))}
        </select>
      </label>
      <button className="mt-auto inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
        Filtrar
      </button>
    </form>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="p-8 text-center">
      <PackageCheck className="mx-auto h-10 w-10 text-primary" />
      <h3 className="mt-4 text-lg font-bold text-primary">No hay órdenes en este estado</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Cuando entren compras pagadas aparecerán aquí para preparación y seguimiento.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const className = getOrderStatusClassName(status);

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${className}`}>
      {formatOrderStatus(status)}
    </span>
  );
}

function getStatusCount(
  counts: Array<{ status: OrderStatus; _count: { status: number } }>,
  status: OrderStatus,
) {
  return counts.find((item) => item.status === status)?._count.status ?? 0;
}

function parseOrderStatus(status: string) {
  return orderStatusOptions.find((option) => option === status);
}
