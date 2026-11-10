import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Info,
  PackageCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { ProductVisual } from "@/components/product/product-visual";
import { StockBadge } from "@/components/product/stock-badge";
import { CartQuantityControl } from "@/components/cart/cart-quantity-control";
import { CartNotice } from "@/components/cart/cart-notice";
import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { getCart, type CartLine } from "@/lib/cart";
import { formatCurrency } from "@/lib/money";
import { firstValue } from "@/lib/url-utils";
import { createStockAlert } from "@/lib/actions/cart";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getStatusMessage } from "@/lib/i18n/status";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Cart.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

type CartTranslator = Awaited<ReturnType<typeof getTranslations<"Cart">>>;

export const dynamic = "force-dynamic";

type CartPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CartPage({ params: routeParams, searchParams }: CartPageProps) {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const cart = await getCart();
  const params = searchParams ? await searchParams : {};
  const status = firstValue(params.estado) ?? "";
  const t = await getTranslations({ locale, namespace: "Cart" });
  // El aviso se resuelve en el servidor y viaja como texto: `CartNotice` es
  // cliente por los temporizadores, y mandarle el namespace `Status` entero
  // significaría enviarlo en cada página del sitio para usarlo solo acá.
  const noticeMessage = await getStatusMessage("cart", status, locale);

  return (
    <main className="min-h-screen bg-ca-bg text-ca-text">
      <SiteHeader locale={locale} />

      <div className="ca-container py-5">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ca-text-secondary transition hover:text-ca-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToCatalog")}
        </Link>

        {/* En mobile: columna única (items arriba, resumen abajo)
            En lg: dos columnas side-by-side */}
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">

          {/* Columna de items */}
          <div className="space-y-4">
            {/* Header */}
            <div className="rounded-ca-surface border border-ca-border bg-ca-surface p-5">
              <p className="text-xs font-bold text-ca-text-secondary">
                {t("eyebrow")}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-ca-navy">{t("title")}</h1>
              {cart.lines.length > 0 ? (
                <p className="mt-1 text-sm text-ca-text-secondary">
                  {t("itemCount", { count: cart.itemCount })}
                </p>
              ) : null}
            </div>

            {noticeMessage ? <CartNotice message={noticeMessage} status={status} /> : null}

            {cart.lines.length > 0 ? (
              <div className="space-y-3">
                {cart.lines.map((line) => (
                  <CartLineItem key={line.product.sku} line={line} locale={locale} t={t} />
                ))}
              </div>
            ) : (
              <EmptyCart t={t} />
            )}
          </div>

          {/* Resumen del pedido */}
          <aside className="h-fit rounded-ca-surface border border-ca-border bg-ca-surface p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-ca-navy" strokeWidth={1.8} />
              <h2 className="text-xl font-bold text-ca-navy">{t("summary.title")}</h2>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow
                label={t("summary.products")}
                value={t("units", { count: cart.itemCount })}
              />
              <div className="border-t border-ca-border pt-3">
                <SummaryRow
                  label={t("summary.subtotal")}
                  value={formatCurrency(cart.subtotalCents, locale)}
                  strong
                />
              </div>
            </dl>

            <div className="mt-4 flex gap-2 rounded-ca-control bg-ca-navy/5 p-3 text-sm font-semibold text-ca-navy">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {t("summary.taxNotice")}
            </div>

            <p className="mt-4 text-sm leading-6 text-ca-text-secondary">
              {t("summary.deliveryNotice")}
            </p>

            <CheckoutReadiness hasBlockingIssues={cart.hasBlockingIssues} t={t} />

            {cart.hasBlockingIssues ? (
              <div className="mt-4 rounded-ca-control bg-danger/10 p-3 text-sm font-semibold text-danger">
                {t("blockingIssues")}
              </div>
            ) : null}

            {cart.lines.length > 0 && !cart.hasBlockingIssues ? (
              <Link
                className={buttonVariants({ size: "lg", className: "mt-5 w-full" })}
                href="/checkout"
              >
                {t("continueToCheckout")}
                <CreditCard className="h-4 w-4" />
              </Link>
            ) : null}

            <Link
              className={buttonVariants({ variant: "outline", className: "mt-3 w-full" })}
              href="/catalog"
            >
              {t("addMore")}
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CartLineItem({
  line,
  locale,
  t,
}: {
  line: CartLine;
  locale: Locale;
  t: CartTranslator;
}) {
  const isUnavailable = line.issue === "unavailable";

  return (
    <article className="rounded-ca-surface border border-ca-border bg-ca-surface p-4">
      <div className="flex gap-4">
        {/* Imagen/visual */}
        <Link
          aria-label={t("line.viewDetail", { name: line.product.name })}
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-ca-control bg-ca-bg"
          href={{ pathname: "/product/[slug]", params: { slug: line.product.slug } }}
        >
          <ProductVisual seed={line.product.sku} size="thumb" />
        </Link>

        {/* Info del producto */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-ca-text-secondary">
                {line.product.category}
              </p>
              <Link
                className="mt-0.5 block font-bold leading-snug text-ca-navy transition hover:text-ca-navy-hover sm:text-xl"
                href={{ pathname: "/product/[slug]", params: { slug: line.product.slug } }}
              >
                {line.product.name}
              </Link>
            </div>
            <StockBadge locale={locale} status={line.product.stockStatus} />
          </div>
          <p className="mt-1.5 text-xs text-ca-text-secondary">
            {line.product.brand} · SKU {line.product.sku}
          </p>
        </div>
      </div>

      {/* Precio + stepper + acciones */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-ca-border pt-4">
        <CartQuantityControl
          sku={line.product.sku}
          initialQuantity={line.quantity}
          max={line.availableQuantity}
          disabled={isUnavailable}
        />

        <div className="text-right">
          <p className="text-xs font-semibold text-ca-text-secondary">
            {formatCurrency(line.product.priceCents, locale)} × {line.quantity}
          </p>
          <p className="text-xl font-bold text-ca-navy">
            {formatCurrency(line.lineTotalCents, locale)}
          </p>
        </div>
      </div>

      {line.issue ? <LineIssue line={line} t={t} /> : null}
    </article>
  );
}

function CheckoutReadiness({
  hasBlockingIssues,
  t,
}: {
  hasBlockingIssues: boolean;
  t: CartTranslator;
}) {
  const items = [
    {
      icon: <PackageCheck className="h-4 w-4" />,
      label: hasBlockingIssues
        ? t("readiness.availabilityPending")
        : t("readiness.availabilityConfirmed"),
      ok: !hasBlockingIssues,
    },
    { icon: <CreditCard className="h-4 w-4" />, label: t("readiness.payment"), ok: true },
    { icon: <Truck className="h-4 w-4" />, label: t("readiness.delivery"), ok: true },
  ];

  return (
    <div className="mt-4 rounded-ca-control border border-ca-border bg-ca-bg p-3">
      <ul className="grid gap-2 text-sm">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-ca-text-secondary">
            <span className={item.ok ? "text-ca-success" : "text-warning"}>{item.icon}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LineIssue({ line, t }: { line: CartLine; t: CartTranslator }) {
  const message =
    line.issue === "unavailable"
      ? t("issue.unavailable")
      : t("issue.limited", { units: t("units", { count: line.availableQuantity }) });

  return (
    <div className="mt-3 rounded-ca-control bg-danger/10 p-3">
      <div className="flex gap-2 text-sm font-semibold text-danger">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {message}
      </div>
      <form action={createStockAlert} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input name="sku" type="hidden" value={line.product.sku} />
        <input name="requestedQuantity" type="hidden" value={line.quantity} />
        <input
          className="h-10 rounded-ca-surface border border-ca-border bg-ca-surface px-3 text-sm"
          name="customerEmail"
          placeholder={t("alert.emailPlaceholder")}
          type="email"
          aria-label={t("alert.emailAriaLabel")}
        />
        <input
          className="h-10 rounded-ca-surface border border-ca-border bg-ca-surface px-3 text-sm"
          name="customerPhone"
          placeholder={t("alert.phonePlaceholder")}
          type="tel"
          aria-label={t("alert.phoneAriaLabel")}
        />
        <button className={buttonVariants()}>
          {t("alert.submit")}
        </button>
      </form>
    </div>
  );
}

function EmptyCart({ t }: { t: CartTranslator }) {
  return (
    <EmptyState
      actionHref="/catalog"
      actionLabel={t("empty.action")}
      description={t("empty.description")}
      icon={<ShoppingCart className="h-7 w-7" strokeWidth={1.5} />}
      title={t("empty.title")}
    />
  );
}


function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ca-text-secondary">{label}</dt>
      <dd className={strong ? "text-xl font-bold text-ca-navy" : "font-bold text-ca-navy"}>
        {value}
      </dd>
    </div>
  );
}

