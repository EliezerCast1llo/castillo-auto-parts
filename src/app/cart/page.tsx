import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Info,
  PackageCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { ProductVisual } from "@/components/product/product-visual";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { StockBadge } from "@/components/product/stock-badge";
import { SiteHeader } from "@/components/site-header";
import { getGuestCart, type CartLine } from "@/lib/cart";
import { formatCurrency } from "@/lib/money";
import { firstValue } from "@/lib/url-utils";
import { createStockAlert, removeCartItem, updateCartItem } from "./actions";

export const metadata = {
  title: "Carrito | Castillo Auto Parts",
  description: "Carrito de compras para repuestos automotrices.",
};

export const dynamic = "force-dynamic";

type CartPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CartPage({ searchParams }: CartPageProps) {
  const cart = await getGuestCart();
  const params = searchParams ? await searchParams : {};
  const status = firstValue(params.estado);
  const statusMessage = getStatusMessage(status);

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ca-text-secondary transition hover:text-ca-navy-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>

        {/* En mobile: columna única (items arriba, resumen abajo)
            En lg: dos columnas side-by-side */}
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">

          {/* Columna de items */}
          <div className="space-y-4">
            {/* Header */}
            <div className="rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)]">
              <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">
                Carrito de compras
              </p>
              <h1 className="mt-1 text-2xl font-black text-ca-navy-950">Tu carrito</h1>
              {cart.lines.length > 0 ? (
                <p className="mt-1 text-sm text-ca-text-secondary">
                  {cart.itemCount} {cart.itemCount === 1 ? "producto" : "productos"}
                </p>
              ) : null}
            </div>

            {statusMessage ? <CartNotice status={status} message={statusMessage} /> : null}

            {cart.lines.length > 0 ? (
              <div className="space-y-3">
                {cart.lines.map((line) => (
                  <CartLineItem key={line.product.sku} line={line} />
                ))}
              </div>
            ) : (
              <EmptyCart />
            )}
          </div>

          {/* Resumen del pedido */}
          <aside className="h-fit rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-premium)] lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-ca-navy-950" strokeWidth={1.8} />
              <h2 className="text-lg font-black text-ca-navy-950">Resumen del pedido</h2>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow label="Productos" value={formatUnits(cart.itemCount)} />
              <div className="border-t border-ca-border pt-3">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(cart.subtotalCents)}
                  strong
                />
              </div>
            </dl>

            <div className="mt-4 flex gap-2 rounded-xl bg-ca-navy-950/5 p-3 text-sm font-semibold text-ca-navy-950">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Precios con IVA incluido (13%).
            </div>

            <CheckoutReadiness hasBlockingIssues={cart.hasBlockingIssues} />

            {cart.hasBlockingIssues ? (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                Ajusta los productos sin disponibilidad para continuar.
              </div>
            ) : null}

            {cart.lines.length > 0 && !cart.hasBlockingIssues ? (
              <Link
                className="mt-5 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-[0_10px_20px_rgba(6,25,51,0.18)] transition hover:bg-ca-navy-800"
                href="/checkout"
              >
                Continuar al pago
                <CreditCard className="h-4 w-4" />
              </Link>
            ) : null}

            <Link
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-ca-border bg-white text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background"
              href="/catalog"
            >
              Agregar más productos
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CartLineItem({ line }: { line: CartLine }) {
  const isUnavailable = line.issue === "unavailable";

  return (
    <article className="rounded-2xl border border-ca-border bg-white p-4 shadow-[var(--ca-shadow-soft)]">
      <div className="flex gap-4">
        {/* Imagen/visual */}
        <Link
          aria-label={`Ver detalle de ${line.product.name}`}
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-ca-background"
          href={`/product/${line.product.slug}`}
        >
          <ProductVisual seed={line.product.sku} size="thumb" />
        </Link>

        {/* Info del producto */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-ca-gold-500">
                {line.product.category}
              </p>
              <Link
                className="mt-0.5 block font-black leading-snug text-ca-navy-950 transition hover:text-ca-blue-700 sm:text-lg"
                href={`/product/${line.product.slug}`}
              >
                {line.product.name}
              </Link>
            </div>
            <StockBadge status={line.product.stockStatus} />
          </div>
          <p className="mt-1.5 text-xs text-ca-text-secondary">
            {line.product.brand} · SKU {line.product.sku}
          </p>
        </div>
      </div>

      {/* Precio + stepper + acciones */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-ca-border pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <form action={updateCartItem} className="flex items-center gap-2">
            <input name="sku" type="hidden" value={line.product.sku} />
            <QuantityStepper
              defaultValue={line.quantity}
              disabled={isUnavailable}
              max={line.availableQuantity}
            />
            <button
              className="h-10 rounded-xl bg-ca-navy-950 px-4 text-sm font-black text-white transition hover:bg-ca-navy-800 disabled:bg-ca-text-secondary/30"
              disabled={isUnavailable}
            >
              Actualizar
            </button>
          </form>

          <form action={removeCartItem}>
            <input name="sku" type="hidden" value={line.product.sku} />
            <button className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-ca-border px-3 text-sm font-bold text-red-500 transition hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </form>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold text-ca-text-secondary">
            {formatCurrency(line.product.priceCents)} × {line.quantity}
          </p>
          <p className="text-xl font-black text-ca-navy-950">
            {formatCurrency(line.lineTotalCents)}
          </p>
        </div>
      </div>

      {line.issue ? <LineIssue line={line} /> : null}
    </article>
  );
}

function CheckoutReadiness({ hasBlockingIssues }: { hasBlockingIssues: boolean }) {
  const items = [
    {
      icon: <PackageCheck className="h-4 w-4" />,
      label: hasBlockingIssues ? "Disponibilidad pendiente" : "Disponibilidad confirmada",
      ok: !hasBlockingIssues,
    },
    { icon: <CreditCard className="h-4 w-4" />, label: "Pago seguro en línea", ok: true },
    { icon: <Truck className="h-4 w-4" />, label: "Método de entrega en checkout", ok: true },
  ];

  return (
    <div className="mt-4 rounded-xl border border-ca-border bg-ca-background p-3">
      <ul className="grid gap-2 text-sm">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-ca-text-secondary">
            <span className={item.ok ? "text-ca-success" : "text-amber-500"}>{item.icon}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LineIssue({ line }: { line: CartLine }) {
  const message =
    line.issue === "unavailable"
      ? "Este producto ya no está disponible. Elimínalo para continuar."
      : `Solo hay ${formatUnits(line.availableQuantity)} disponibles. Ajusta la cantidad.`;

  return (
    <div className="mt-3 rounded-xl bg-red-50 p-3">
      <div className="flex gap-2 text-sm font-semibold text-red-600">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {message}
      </div>
      <form action={createStockAlert} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input name="sku" type="hidden" value={line.product.sku} />
        <input name="requestedQuantity" type="hidden" value={line.quantity} />
        <input
          className="h-10 rounded-xl border border-ca-border bg-white px-3 text-sm"
          name="customerEmail"
          placeholder="Email para aviso"
          type="email"
          aria-label="Email para aviso de disponibilidad"
        />
        <input
          className="h-10 rounded-xl border border-ca-border bg-white px-3 text-sm"
          name="customerPhone"
          placeholder="Teléfono (opcional)"
          type="tel"
          aria-label="Teléfono para aviso"
        />
        <button className="h-10 rounded-xl bg-ca-navy-950 px-4 text-sm font-black text-white transition hover:bg-ca-navy-800">
          Avisarme
        </button>
      </form>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="rounded-2xl border border-ca-border bg-white p-10 text-center shadow-[var(--ca-shadow-soft)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ca-navy-950/5">
        <ShoppingCart className="h-8 w-8 text-ca-navy-950" strokeWidth={1.5} />
      </div>
      <h2 className="mt-4 text-xl font-black text-ca-navy-950">Tu carrito está vacío</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ca-text-secondary">
        Explora el catálogo y agrega los repuestos que necesitas.
      </p>
      <Link
        className="mt-5 inline-flex h-12 items-center justify-center rounded-[14px] bg-ca-navy-950 px-6 text-sm font-black text-white transition hover:bg-ca-navy-800"
        href="/catalog"
      >
        Explorar catálogo
      </Link>
    </div>
  );
}

function CartNotice({ message, status }: { message: string; status: string }) {
  const isError = [
    "stock_alert_db_unavailable",
    "stock_alert_invalid",
    "stock_alert_not_found",
    "unavailable",
  ].includes(status);

  return (
    <div
      className={`flex gap-2 rounded-xl p-3 text-sm font-semibold ${
        isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
      }`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ca-text-secondary">{label}</dt>
      <dd className={strong ? "text-xl font-black text-ca-navy-950" : "font-bold text-ca-navy-950"}>
        {value}
      </dd>
    </div>
  );
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    added: "Producto agregado al carrito.",
    empty_cart: "Agrega productos antes de continuar.",
    invalid: "No pudimos procesar esa acción. Intenta de nuevo.",
    quantity_adjusted: "Ajustamos la cantidad al stock disponible.",
    removed: "Producto eliminado.",
    stock_alert_created: "Listo. Te avisamos cuando haya disponibilidad.",
    stock_alert_db_unavailable: "No pudimos guardar el aviso. Inténtalo más tarde.",
    stock_alert_invalid: "Ingresa un email o teléfono válido.",
    stock_alert_not_found: "No encontramos ese producto.",
    stock_alert_rate_limited: "Demasiados intentos. Intenta en unos minutos.",
    stock_issue: "Revisa disponibilidad antes de continuar.",
    unavailable: "Este producto ya no está disponible.",
    updated: "Carrito actualizado.",
  };

  return messages[status] ?? "";
}

function formatUnits(quantity: number) {
  return quantity === 1 ? "1 unidad" : `${quantity} unidades`;
}
