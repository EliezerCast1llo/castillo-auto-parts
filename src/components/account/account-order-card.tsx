import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { APP_TIME_ZONE, toIntlLocale } from "@/lib/i18n/intl-locale";
import { Link } from "@/lib/i18n/navigation";
import type { Prisma } from "@prisma/client";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  MapPin,
  Package,
  PackageOpen,
  RotateCcw,
  Store,
  Truck,
} from "lucide-react";
import { OrderStatusStepper } from "@/components/account/order-status-stepper";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { formatCurrency } from "@/lib/money";
import { formatDateTime } from "@/lib/order-formatters";
import { getOrderTrackingState } from "@/lib/order-tracking";

export const accountOrderCardInclude = {
  address: true,
  items: {
    include: {
      product: {
        include: {
          category: true,
          compatibilities: {
            take: 1,
          },
          images: {
            orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
            take: 3,
          },
        },
      },
    },
  },
  payment: true,
  shipment: true,
} satisfies Prisma.OrderInclude;

export type AccountOrderCardOrder = Prisma.OrderGetPayload<{
  include: typeof accountOrderCardInclude;
}>;

type OrdersTranslator = Awaited<ReturnType<typeof getTranslations<"Orders">>>;

type AccountOrderCardProps = {
  order: AccountOrderCardOrder;
  locale: Locale;
};

export async function AccountOrderCard({ locale, order }: AccountOrderCardProps) {
  const t = await getTranslations({ locale, namespace: "Orders" });
  const tracking = getOrderTrackingState(order);
  const productCount = getOrderProductCount(order);
  const hasMultipleProducts = order.items.length > 1 || productCount > 1;
  const supportMessage = `Hola, necesito ayuda con mi pedido ${order.orderNumber}.`;

  return (
    <article className="grid gap-4 rounded-2xl border border-ca-border bg-white p-4 shadow-[var(--ca-shadow-soft)] lg:grid-cols-[230px_minmax(0,1fr)_190px] lg:gap-0 lg:p-0">
      <section className="lg:border-r lg:border-ca-border lg:p-5">
        <p className="text-xs font-bold text-ca-text-secondary">{t("card.orderLabel")}</p>
        <h2 className="mt-1 break-words text-xl font-black leading-tight text-ca-navy-950">
          {order.orderNumber}
        </h2>
        <p className="mt-2 text-sm font-medium text-ca-text-secondary">
          {formatDateTime(order.createdAt, locale)}
        </p>
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-ca-text-secondary">
          <Package className="h-4 w-4" strokeWidth={1.8} />
          {t("productCount", { count: productCount })}
        </p>
        <StatusBadge className="mt-4 lg:hidden" t={t} tracking={tracking} />
      </section>

      <section className="min-w-0 space-y-4 lg:p-5">
        <OrderStatusStepper
          isCancelled={tracking.isCancelled}
          isRefunded={tracking.isRefunded}
          label={t(`tracking.${tracking.labelKey}`)}
          steps={tracking.steps.map((step) => ({ ...step, label: t(`step.${step.key}`) }))}
        />

        <div className="grid gap-4 border-t border-ca-border pt-4 md:grid-cols-[minmax(0,1fr)_240px]">
          <ProductSummary
            hasMultipleProducts={hasMultipleProducts}
            order={order}
            productCount={productCount}
            t={t}
          />
          <FulfillmentSummary locale={locale} order={order} t={t} tracking={tracking} />
        </div>
      </section>

      <aside className="flex flex-col justify-between gap-4 lg:p-5">
        <div className="flex items-start justify-between gap-3 lg:block">
          <StatusBadge className="hidden lg:inline-flex" t={t} tracking={tracking} />
          <p className="text-right text-2xl font-black text-ca-navy-950 lg:mt-5">
            {formatCurrency(order.totalCents, locale)}
          </p>
        </div>

        <div className="grid gap-2">
          <OrderAction
            action={tracking.primaryAction}
            message={supportMessage}
            orderNumber={order.orderNumber}
            primary
            t={t}
          />
          {tracking.secondaryAction ? (
            <OrderAction
              action={tracking.secondaryAction}
              message={supportMessage}
              orderNumber={order.orderNumber}
              t={t}
            />
          ) : null}
        </div>
      </aside>
    </article>
  );
}

function StatusBadge({
  className = "",
  t,
  tracking,
}: {
  className?: string;
  t: OrdersTranslator;
  tracking: ReturnType<typeof getOrderTrackingState>;
}) {
  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${tracking.badgeClassName} ${className}`}
    >
      {t(`tracking.${tracking.labelKey}`)}
    </span>
  );
}

function ProductSummary({
  hasMultipleProducts,
  order,
  productCount,
  t,
}: {
  hasMultipleProducts: boolean;
  order: AccountOrderCardOrder;
  productCount: number;
  t: OrdersTranslator;
}) {
  if (!hasMultipleProducts) {
    const item = order.items[0];

    if (!item) return null;

    return (
      <div className="flex min-w-0 gap-3">
        <ProductThumb item={item} />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-black text-ca-navy-950">
            {item.productNameSnapshot}
          </p>
          <p className="mt-1 text-sm font-semibold text-ca-text-secondary">
            {t("card.unitCount", { count: item.quantity })}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.06em] text-ca-text-secondary">
            {t("card.sku", { sku: item.skuSnapshot })}
          </p>
          {item.partNumberSnapshot ? (
            <p className="mt-0.5 text-xs font-semibold text-ca-text-secondary">
              {t("card.part", { part: item.partNumberSnapshot })}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs font-semibold text-ca-text-secondary">
            {item.brandSnapshot}
          </p>
          <VehicleFitment item={item} t={t} />
        </div>
      </div>
    );
  }

  const visibleItems = order.items.slice(0, 3);
  const extraCount = Math.max(order.items.length - visibleItems.length, 0);

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        {visibleItems.map((item) => (
          <ProductThumb item={item} key={item.id} />
        ))}
        {extraCount > 0 ? (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-ca-border bg-ca-background text-sm font-black text-ca-text-secondary">
            +{extraCount}
          </span>
        ) : null}
      </div>

      <div className="mt-3 min-w-0">
        <p className="text-sm font-black text-ca-navy-950">
          {t("productCount", { count: productCount })}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-ca-text-secondary">
          {summarizeProducts(order, t)}
        </p>
        <details className="mt-1 group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-black text-ca-navy-950">
            {t("card.viewProducts")}
            <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
          </summary>
          <ul className="mt-2 space-y-1.5 text-xs font-semibold text-ca-text-secondary">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity}x {item.productNameSnapshot}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

function ProductThumb({ item }: { item: AccountOrderCardOrder["items"][number] }) {
  const image = item.product.images[0];

  return (
    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ca-border bg-ca-background">
      {image ? (
        <Image
          alt={image.alt}
          className="object-contain p-1.5"
          fill
          sizes="56px"
          src={image.url}
        />
      ) : (
        <PackageOpen className="h-6 w-6 text-ca-text-secondary" strokeWidth={1.8} />
      )}
    </span>
  );
}

function VehicleFitment({
  item,
  t,
}: {
  item: AccountOrderCardOrder["items"][number];
  t: OrdersTranslator;
}) {
  const fitment = item.product.compatibilities[0];

  if (!fitment) return null;

  return (
    <p className="mt-1 text-xs font-semibold text-ca-text-secondary">
      {t("card.compatible", {
        vehicle: `${fitment.make} ${fitment.model} ${fitment.yearFrom}-${fitment.yearTo}`,
      })}
    </p>
  );
}

function FulfillmentSummary({
  locale,
  order,
  t,
  tracking,
}: {
  locale: Locale;
  order: AccountOrderCardOrder;
  t: OrdersTranslator;
  tracking: ReturnType<typeof getOrderTrackingState>;
}) {
  const isPickup = order.shipment?.method === "PICKUP";
  const Icon = isPickup ? Store : Truck;

  return (
    <div className="grid content-start gap-2 border-t border-ca-border pt-4 text-sm md:border-l md:border-t-0 md:pl-4 md:pt-0">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ca-navy-950" strokeWidth={1.8} />
        <div>
          <p className="font-black text-ca-navy-950">{t(`fulfillment.${tracking.fulfillmentKey}`)}</p>
          {order.shipment?.deliveryZone ? (
            <p className="mt-0.5 text-xs font-semibold text-ca-text-secondary">
              {order.shipment.deliveryZone}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ca-text-secondary" strokeWidth={1.8} />
        <div>
          <p className="font-semibold text-ca-text-secondary">
            {t(`dateLabel.${tracking.dateLabelKey}`)}:
          </p>
          <p className="font-black text-ca-navy-950">
            {formatTrackingDate(tracking.dateValue, locale, t("dateLabel.pending"))}
          </p>
        </div>
      </div>

      {order.address && !isPickup ? (
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ca-text-secondary" strokeWidth={1.8} />
          <p className="line-clamp-2 text-xs font-semibold leading-5 text-ca-text-secondary">
            {order.address.formattedAddress}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function OrderAction({
  action,
  message,
  orderNumber,
  primary = false,
  t,
}: {
  action:
    | NonNullable<ReturnType<typeof getOrderTrackingState>["secondaryAction"]>
    | ReturnType<typeof getOrderTrackingState>["primaryAction"];
  message: string;
  orderNumber: string;
  primary?: boolean;
  t: OrdersTranslator;
}) {
  const label = t(`action.${action}`);

  if (action === "contact") {
    return (
      <WhatsAppCTA
        className="w-full"
        label={label}
        message={message}
        phone={SUPPORT_WHATSAPP_NUMBER}
        variant="subtle"
      />
    );
  }

  if (action === "reorder") {
    return (
      <Link className={getActionClassName(primary)} href="/catalog">
        <span>{label}</span>
        <RotateCcw className="h-4 w-4" strokeWidth={1.9} />
      </Link>
    );
  }

  // TODO: Reemplazar por link a una ruta segura /account/orders/[orderNumber] cuando exista.
  return (
    <button
      className={getActionClassName(primary)}
      title={t("action.detailTitle", { orderNumber })}
      type="button"
    >
      <span>{label}</span>
      {action === "track" ? (
        <MapPin className="h-4 w-4" strokeWidth={1.9} />
      ) : primary ? (
        <ChevronRight className="h-4 w-4" strokeWidth={2} />
      ) : null}
    </button>
  );
}

function getActionClassName(primary: boolean) {
  return primary
    ? "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ca-navy-950 px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(6,25,51,0.16)] transition hover:bg-ca-navy-800"
    : "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-ca-border bg-white px-4 text-sm font-black text-ca-navy-950 transition hover:bg-ca-background";
}

function getOrderProductCount(order: AccountOrderCardOrder) {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}

function summarizeProducts(order: AccountOrderCardOrder, t: OrdersTranslator) {
  const names = order.items.slice(0, 2).map((item) => item.productNameSnapshot);
  const joined = names.join(", ");

  if (order.items.length <= 2) return joined;

  return t("detail.andMore", { names: joined });
}

function formatTrackingDate(
  value: Date | string | null | undefined,
  locale: Locale,
  pendingLabel: string,
) {
  if (!value) return pendingLabel;
  if (typeof value === "string") return value;

  // El huso se queda fijo en el del negocio y no sigue al idioma: un cliente
  // anglófono en El Salvador quiere la fecha de El Salvador. Lo que cambia con
  // el idioma es la grafía, no el momento.
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: "medium",
    timeZone: APP_TIME_ZONE,
  }).format(value);
}
