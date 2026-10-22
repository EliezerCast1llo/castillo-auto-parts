import { Link } from "@/lib/i18n/navigation";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, CreditCard, Info, PackageCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { verifyOrderAccessToken } from "@/lib/order-access-token";
import { firstValue } from "@/lib/url-utils";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getTranslations } from "next-intl/server";
import { toIntlLocale } from "@/lib/i18n/intl-locale";

export const dynamic = "force-dynamic";

type OrderPageProps = {
  params: Promise<{
    locale: string;
    orderNumber: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: OrderPageProps) {
  const { orderNumber } = await params;
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Orders.detail" });

  return {
    title: t("metadataTitle", { orderNumber }),
  };
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const locale = await resolveAndPublishRouteLocale(params);
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
  // `formatOrderStatus` se queda para el admin y los correos, que no tienen
  // idioma que pasarles. El storefront lo resuelve por el enum, que ya era una
  // clave independiente del idioma.
  const t = await getTranslations({ locale, namespace: "Orders" });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={locale} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-card p-5">
              <p className={`text-sm font-semibold ${isPaymentProcessing ? "text-primary" : "text-success"}`}>
                {isPaymentProcessing ? t("detail.paymentInProgress") : t("detail.orderCreated")}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-primary">{order.orderNumber}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t("detail.currentStatus", {
                  status: t(`status.${order.status}`).toLocaleLowerCase(toIntlLocale(locale)),
                })}
              </p>
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-bold text-primary">{t("detail.productsSection")}</h2>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div
                    className="flex flex-col justify-between gap-2 rounded-md bg-background p-3 text-sm md:flex-row"
                    key={item.id}
                  >
                    <div>
                      <p className="font-bold">{item.productNameSnapshot}</p>
                      <p className="mt-1 text-muted-foreground">
                        {item.brandSnapshot} · {item.skuSnapshot} ·{" "}
                        {t("detail.units", { count: item.quantity })}
                      </p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(item.lineTotalCents, locale)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-bold text-primary">{t("detail.deliverySection")}</h2>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <InfoItem
                  label={t("detail.method")}
                  value={t(`method.${shipmentMethodKey(order.shipment?.method)}`)}
                />
                <InfoItem
                  label={t("detail.zone")}
                  value={order.shipment?.deliveryZone ?? t("detail.pending")}
                />
                {order.address ? (
                  <InfoItem label={t("detail.address")} value={order.address.formattedAddress} />
                ) : (
                  <InfoItem label={t("detail.address")} value={t("detail.pickupAtWarehouse")} />
                )}
                <InfoItem label={t("detail.customer")} value={order.customerName} />
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-md border border-border bg-card p-5 shadow-ca-card">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-primary">{t("detail.summarySection")}</h2>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <SummaryRow
                label={t("detail.products")}
                value={formatCurrency(order.subtotalCents, locale)}
              />
              <SummaryRow
                label={t("detail.shipping")}
                value={formatCurrency(order.shippingCents, locale)}
              />
              <SummaryRow
                label={t("detail.total")}
                value={formatCurrency(order.totalCents, locale)}
                strong
              />
            </dl>

            <div className="mt-4 flex gap-2 rounded-md bg-primary/5 p-3 text-sm font-semibold text-primary">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {t("detail.taxNotice")}
            </div>

            <div className="mt-5 rounded-md bg-background p-4 text-sm">
              <div className="flex gap-2 font-semibold text-foreground">
                {isPaymentProcessing ? (
                  <Clock3 className="h-4 w-4 text-primary" />
                ) : (
                  <CreditCard className="h-4 w-4 text-primary" />
                )}
                {isPaymentProcessing ? t("detail.confirmingPayment") : t("detail.paymentConfirmed")}
              </div>
              <p className="mt-2 text-muted-foreground">
                {isPaymentProcessing
                  ? t("detail.waitingProvider")
                  : t("detail.readyForPreparation")}
              </p>
            </div>

            <Link
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white"
              href="/catalog"
            >
              <CheckCircle2 className="h-4 w-4" />
              {t("detail.backToCatalog")}
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}

/** El método puede venir nulo en órdenes sin envío todavía asignado. */
function shipmentMethodKey(method: string | null | undefined) {
  return method === "PICKUP" || method === "LOCAL_DELIVERY" ? method : "PENDING";
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
