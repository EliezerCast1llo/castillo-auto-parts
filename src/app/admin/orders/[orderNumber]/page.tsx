import type { OrderStatus } from "@prisma/client";
import { ArrowLeft, CreditCard, MapPin, PackageCheck, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminSessionControls } from "@/components/admin/admin-session-controls";
import { SiteHeader } from "@/components/site-header";
import { requireAdminAccess } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { updateAdminOrderStatus } from "./actions";

export const dynamic = "force-dynamic";

type AdminOrderDetailPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const orderStatusOptions: OrderStatus[] = [
  "PAID_PENDING_SHIPMENT",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export async function generateMetadata({ params }: AdminOrderDetailPageProps) {
  const { orderNumber } = await params;

  return {
    title: `Admin ${orderNumber} | Castillo Auto Parts`,
  };
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: AdminOrderDetailPageProps) {
  const { orderNumber } = await params;
  await requireAdminAccess(`/admin/orders/${orderNumber}`);

  const query = searchParams ? await searchParams : {};
  const statusMessage = getStatusMessage(firstValue(query.estado));
  const order = await db.order.findUnique({
    include: {
      address: true,
      items: true,
      payment: {
        include: {
          events: {
            orderBy: {
              receivedAt: "desc",
            },
            take: 5,
          },
        },
      },
      shipment: true,
    },
    where: {
      orderNumber,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Volver a órdenes
        </Link>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-card p-5">
              <p className="text-sm font-semibold text-success">Orden admin</p>
              <div className="mt-1 flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <h1 className="text-2xl font-bold text-primary">{order.orderNumber}</h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Creada el {formatDateTime(order.createdAt)}.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <StatusBadge status={order.status} />
                  <AdminSessionControls />
                </div>
              </div>
            </div>

            {statusMessage ? <AdminNotice message={statusMessage} /> : null}

            <section className="rounded-md border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-primary">Productos</h2>
              </div>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div
                    className="grid gap-3 rounded-md bg-background p-3 text-sm md:grid-cols-[1fr_120px_120px]"
                    key={item.id}
                  >
                    <div>
                      <p className="font-bold">{item.productNameSnapshot}</p>
                      <p className="mt-1 text-muted-foreground">
                        {item.brandSnapshot} · {item.skuSnapshot}
                      </p>
                    </div>
                    <InfoBlock label="Cantidad" value={`${item.quantity}`} />
                    <InfoBlock label="Total línea" value={formatCurrency(item.lineTotalCents)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-primary">Entrega</h2>
              </div>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <InfoBlock label="Método" value={formatShipmentMethod(order.shipment?.method)} />
                <InfoBlock label="Estado envío" value={formatShipmentStatus(order.shipment?.status)} />
                <InfoBlock label="Zona" value={order.shipment?.deliveryZone ?? "Pendiente"} />
                <InfoBlock label="Cliente" value={order.customerName} />
                {order.address ? (
                  <InfoBlock label="Dirección" value={order.address.formattedAddress} />
                ) : (
                  <InfoBlock label="Dirección" value="Retiro en bodega" />
                )}
                <InfoBlock label="Teléfono" value={order.customerPhone} />
              </div>
            </section>
          </div>

          <aside className="h-fit space-y-4">
            <section className="rounded-md border border-border bg-card p-5 shadow-[0_16px_40px_rgba(18,50,74,0.08)]">
              <h2 className="text-lg font-bold text-primary">Cambiar estado</h2>
              <form action={updateAdminOrderStatus} className="mt-4 space-y-3">
                <input name="orderNumber" type="hidden" value={order.orderNumber} />
                <label className="block text-sm font-semibold">
                  Estado de orden
                  <select
                    className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                    defaultValue={order.status}
                    name="status"
                  >
                    {orderStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatOrderStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
                  Guardar estado
                </button>
              </form>
            </section>

            <section className="rounded-md border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-primary">Pago</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <InfoBlock label="Proveedor" value={formatPaymentProvider(order.payment?.provider)} />
                <InfoBlock label="Estado" value={formatPaymentStatus(order.payment?.status)} />
                <InfoBlock label="Referencia" value={order.payment?.externalPaymentId ?? "Pendiente"} />
              </div>
            </section>

            <section className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-bold text-primary">Resumen</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow label="Productos" value={formatCurrency(order.subtotalCents)} />
                <SummaryRow label="Envío" value={formatCurrency(order.shippingCents)} />
                <SummaryRow label="Total" value={formatCurrency(order.totalCents)} strong />
              </dl>
            </section>

            <section className="rounded-md border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-primary">Eventos de pago</h2>
              </div>
              <div className="mt-4 space-y-2">
                {order.payment?.events.length ? (
                  order.payment.events.map((event) => (
                    <div className="rounded-md bg-background p-3 text-sm" key={event.id}>
                      <p className="font-semibold">{event.eventType}</p>
                      <p className="mt-1 text-muted-foreground">
                        {formatDateTime(event.receivedAt)} · {event.isValid ? "Válido" : "No válido"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function AdminNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-success/10 p-3 text-sm font-semibold text-success">
      {message}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const className = getStatusClassName(status);

  return (
    <span className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${className}`}>
      {formatOrderStatus(status)}
    </span>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "text-xl font-bold text-primary" : "font-semibold"}>{value}</dd>
    </div>
  );
}

function getStatusClassName(status: OrderStatus) {
  if (status === "PAID_PENDING_SHIPMENT") return "bg-warning/15 text-warning";
  if (status === "SHIPPED") return "bg-primary/10 text-primary";
  if (status === "DELIVERED") return "bg-success/10 text-success";
  if (status === "CANCELLED" || status === "REFUNDED") return "bg-danger/10 text-danger";
  return "bg-muted text-muted-foreground";
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    updated: "Estado de orden actualizado.",
  };

  return messages[status] ?? "";
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatOrderStatus(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    CANCELLED: "Cancelada",
    DELIVERED: "Entregada",
    PAID_PENDING_SHIPMENT: "Pendiente de entrega",
    REFUNDED: "Reembolsada",
    SHIPPED: "Enviada",
  };

  return labels[status];
}

function formatShipmentMethod(method: string | undefined) {
  if (method === "PICKUP") return "Retiro en bodega";
  if (method === "LOCAL_DELIVERY") return "Envío local";
  return "Pendiente";
}

function formatShipmentStatus(status: string | undefined) {
  const labels: Record<string, string> = {
    CANCELLED: "Cancelado",
    DELIVERED: "Entregado",
    IN_TRANSIT: "En tránsito",
    PENDING: "Pendiente",
  };

  return status ? labels[status] ?? status : "Pendiente";
}

function formatPaymentProvider(provider: string | undefined) {
  if (provider === "mock") return "Pago mock";
  if (provider === "wompi") return "Wompi";
  if (provider === "pagadito") return "Pagadito";
  if (provider === "bac_manual") return "BAC manual";
  return "Pendiente";
}

function formatPaymentStatus(status: string | undefined) {
  const labels: Record<string, string> = {
    CANCELLED: "Cancelado",
    FAILED: "Fallido",
    PAID: "Pagado",
    PENDING: "Pendiente",
    REFUNDED: "Reembolsado",
  };

  return status ? labels[status] ?? status : "Pendiente";
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(date);
}
