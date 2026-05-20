import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
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
import { removeCartItem, updateCartItem } from "./actions";

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
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-card p-5">
              <p className="text-sm font-semibold text-success">Carrito de invitado</p>
              <h1 className="mt-1 text-2xl font-bold text-primary">Tu carrito</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Revisa cantidades y disponibilidad antes de continuar con el pago.
              </p>
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

          <aside className="h-fit rounded-md border border-border bg-card p-5 shadow-[0_16px_40px_rgba(18,50,74,0.08)]">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-primary">Resumen</h2>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Productos" value={formatUnits(cart.itemCount)} />
              <SummaryRow label="Subtotal" value={formatCurrency(cart.subtotalCents)} strong />
            </dl>

            <div className="mt-4 flex gap-2 rounded-md bg-primary/5 p-3 text-sm font-semibold text-primary">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Los precios ya incluyen IVA.
            </div>

            <CheckoutReadiness hasBlockingIssues={cart.hasBlockingIssues} />

            {cart.hasBlockingIssues ? (
              <div className="mt-5 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
                Ajusta los productos sin disponibilidad para continuar.
              </div>
            ) : null}

            {cart.lines.length > 0 && !cart.hasBlockingIssues ? (
              <Link
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
                href="/checkout"
              >
                Continuar al pago
              </Link>
            ) : null}

            <Link
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary"
              href="/catalog"
            >
              Agregar más productos
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}

function CartLineItem({ line }: { line: CartLine }) {
  const isUnavailable = line.issue === "unavailable";

  return (
    <article className="grid gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-[140px_1fr]">
      <Link
        aria-label={`Ver detalle de ${line.product.name}`}
        className="flex h-36 items-center justify-center rounded-md bg-muted"
        href={`/product/${line.product.slug}`}
      >
        <ProductVisual seed={line.product.sku} />
      </Link>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-success">{line.product.category}</p>
              <Link className="mt-1 block text-lg font-bold text-primary" href={`/product/${line.product.slug}`}>
                {line.product.name}
              </Link>
            </div>
            <StockBadge status={line.product.stockStatus} />
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {line.product.brand} · Parte {line.product.partNumber}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
            SKU {line.product.sku}
          </p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">{line.product.compatibility}</p>

          {line.issue ? <LineIssue line={line} /> : null}
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div className="text-right md:text-left">
            <p className="text-sm font-semibold text-muted-foreground">Precio</p>
            <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(line.product.priceCents)}</p>
          </div>

          <div className="grid gap-2">
            <form action={updateCartItem} className="grid gap-2">
              <input name="sku" type="hidden" value={line.product.sku} />
              <QuantityStepper
                defaultValue={line.quantity}
                disabled={isUnavailable}
                max={line.availableQuantity}
              />
              <button
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:bg-muted disabled:text-muted-foreground"
                disabled={isUnavailable}
              >
                Actualizar
              </button>
            </form>

            <form action={removeCartItem}>
              <input name="sku" type="hidden" value={line.product.sku} />
              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-danger">
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </form>
          </div>

          <div className="rounded-md bg-background p-3 text-sm">
            <p className="text-muted-foreground">Total línea</p>
            <p className="mt-1 text-lg font-bold text-primary">{formatCurrency(line.lineTotalCents)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function CheckoutReadiness({ hasBlockingIssues }: { hasBlockingIssues: boolean }) {
  const items = [
    {
      icon: <PackageCheck className="h-4 w-4" />,
      label: hasBlockingIssues ? "Disponibilidad pendiente de ajustar" : "Disponibilidad lista",
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      label: "Pago completo en línea",
    },
    {
      icon: <Truck className="h-4 w-4" />,
      label: "Retiro o envío se define en checkout",
    },
  ];

  return (
    <div className="mt-4 rounded-md border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-bold text-primary">
        <CheckCircle2 className="h-4 w-4" />
        Revisión antes de pagar
      </div>
      <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className={hasBlockingIssues ? "text-warning" : "text-success"}>{item.icon}</span>
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
      ? "Este producto ya no está disponible. Elimínalo del carrito para continuar."
      : `Solo hay ${formatUnits(line.availableQuantity)} disponibles. Ajusta la cantidad.`;

  return (
    <div className="mt-3 flex gap-2 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="rounded-md border border-border bg-card p-8 text-center">
      <PackageCheck className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-4 text-xl font-bold text-primary">Tu carrito está vacío</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Agrega repuestos desde el catálogo para preparar tu compra.
      </p>
      <Link
        className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
        href="/catalog"
      >
        Ver catálogo
      </Link>
    </div>
  );
}

function CartNotice({ message, status }: { message: string; status: string }) {
  const isError = status === "unavailable";

  return (
    <div
      className={`flex gap-2 rounded-md p-3 text-sm font-semibold ${
        isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
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
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "text-xl font-bold text-primary" : "font-semibold"}>{value}</dd>
    </div>
  );
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    added: "Producto agregado al carrito.",
    empty_cart: "Agrega productos antes de continuar con la compra.",
    quantity_adjusted: "Ajustamos la cantidad al stock disponible.",
    removed: "Producto eliminado del carrito.",
    stock_issue: "Revisa disponibilidad y cantidades antes de continuar.",
    unavailable: "Este producto ya no está disponible.",
    updated: "Carrito actualizado.",
  };

  return messages[status] ?? "";
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatUnits(quantity: number) {
  return quantity === 1 ? "1 unidad" : `${quantity} unidades`;
}
