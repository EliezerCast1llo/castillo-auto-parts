import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, CreditCard, Info, PackageCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { formatOrderStatus, formatShipmentMethod } from "@/lib/order-formatters";
import { verifyOrderAccessToken } from "@/lib/order-access-token";
import { firstValue } from "@/lib/url-utils";

export const dynamic = "force-dynamic";

type OrderPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: OrderPageProps) {
  const { orderNumber } = await params;

  return {
    title: `Orden ${orderNumber} | Castillo Auto Parts`,
  };
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { orderNumber } = await params;
  const paramsValue = searchParams ? await searchParams : {};
  const accessToken = firstValue(paramsValue.token);
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      address: true,
      items: true,
      payment: true,
      shipment: true,
    },
  });

  if (!order) {
    notFound();
  }

  if (
    !verifyOrderAccessToken(accessToken, order.accessTokenHash) &&
    !verifyOrderAccessToken(accessToken, order.emailAccessTokenHash)
  ) {
    notFound();
  }

  const isPaymentProcessing = order.status === "PAYMENT_PROCESSING";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-card p-5">
              <p className={`text-sm font-semibold ${isPaymentProcessing ? "text-primary" : "text-success"}`}>
                {isPaymentProcessing ? "Pago en proceso" : "Orden creada"}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-primary">{order.orderNumber}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Estado actual: {formatOrderStatus(order.status).toLowerCase()}.
              </p>
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-bold text-primary">Productos</h2>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div
                    className="flex flex-col justify-between gap-2 rounded-md bg-background p-3 text-sm md:flex-row"
                    key={item.id}
                  >
                    <div>
                      <p className="font-bold">{item.productNameSnapshot}</p>
                      <p className="mt-1 text-muted-foreground">
                        {item.brandSnapshot} · {item.skuSnapshot} · {item.quantity} unidad
                        {item.quantity === 1 ? "" : "es"}
                      </p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(item.lineTotalCents)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-bold text-primary">Entrega</h2>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <InfoItem label="Método" value={formatShipmentMethod(order.shipment?.method)} />
                <InfoItem label="Zona" value={order.shipment?.deliveryZone ?? "Pendiente"} />
                {order.address ? (
                  <InfoItem label="Dirección" value={order.address.formattedAddress} />
                ) : (
                  <InfoItem label="Dirección" value="Retiro en bodega" />
                )}
                <InfoItem label="Cliente" value={order.customerName} />
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-md border border-border bg-card p-5 shadow-ca-card">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-primary">Resumen</h2>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Productos" value={formatCurrency(order.subtotalCents)} />
              <SummaryRow label="Envío" value={formatCurrency(order.shippingCents)} />
              <SummaryRow label="Total" value={formatCurrency(order.totalCents)} strong />
            </dl>

            <div className="mt-4 flex gap-2 rounded-md bg-primary/5 p-3 text-sm font-semibold text-primary">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Los precios ya incluyen IVA.
            </div>

            <div className="mt-5 rounded-md bg-background p-4 text-sm">
              <div className="flex gap-2 font-semibold text-foreground">
                {isPaymentProcessing ? (
                  <Clock3 className="h-4 w-4 text-primary" />
                ) : (
                  <CreditCard className="h-4 w-4 text-primary" />
                )}
                {isPaymentProcessing ? "Confirmando pago" : "Pago confirmado"}
              </div>
              <p className="mt-2 text-muted-foreground">
                {isPaymentProcessing
                  ? "Estamos esperando la confirmación del proveedor. Este pedido aún no está listo para preparación."
                  : "El pago fue confirmado y el pedido está listo para preparación."}
              </p>
            </div>

            <Link
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white"
              href="/catalog"
            >
              <CheckCircle2 className="h-4 w-4" />
              Volver al catálogo
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
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
