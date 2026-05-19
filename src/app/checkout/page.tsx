import Link from "next/link";
import { AlertCircle, ArrowLeft, CreditCard, MapPin, PackageCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getGuestCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/money";
import { createPendingOrder } from "./actions";

export const metadata = {
  title: "Finalizar compra | Castillo Auto Parts",
  description: "Finalizar compra como invitado en Castillo Auto Parts.",
};

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const cart = await getGuestCart();
  const params = searchParams ? await searchParams : {};
  const status = firstValue(params.estado);
  const statusMessage = getStatusMessage(status);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Volver al carrito
        </Link>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-card p-5">
              <p className="text-sm font-semibold text-success">Compra de invitado</p>
              <h1 className="mt-1 text-2xl font-bold text-primary">Datos de entrega y pago</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Completa tus datos para reservar la orden y continuar con el pago.
              </p>
            </div>

            {statusMessage ? <CheckoutNotice status={status} message={statusMessage} /> : null}

            {cart.lines.length > 0 && !cart.hasBlockingIssues ? (
              <CheckoutForm />
            ) : (
              <EmptyCheckout hasIssues={cart.hasBlockingIssues} />
            )}
          </div>

          <aside className="h-fit rounded-md border border-border bg-card p-5 shadow-[0_16px_40px_rgba(18,50,74,0.08)]">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-primary">Resumen</h2>
            </div>

            <div className="mt-5 space-y-3">
              {cart.lines.map((line) => (
                <div className="flex justify-between gap-3 text-sm" key={line.product.sku}>
                  <div>
                    <p className="font-semibold">{line.product.name}</p>
                    <p className="text-muted-foreground">{line.quantity} x {formatCurrency(line.product.priceCents)}</p>
                  </div>
                  <p className="font-bold text-primary">{formatCurrency(line.lineTotalCents)}</p>
                </div>
              ))}
            </div>

            <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
              <SummaryRow label="Subtotal" value={formatCurrency(cart.subtotalCents)} />
              <SummaryRow label="Retiro" value={formatCurrency(0)} />
              <SummaryRow label="Santa Tecla" value={formatCurrency(200)} />
              <SummaryRow label="San Salvador" value={formatCurrency(300)} />
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}

function CheckoutForm() {
  return (
    <form action={createPendingOrder} className="space-y-4">
      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Cliente</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CheckoutField label="Nombre completo" name="customerName" required />
          <CheckoutField label="Email" name="customerEmail" required type="email" />
          <CheckoutField label="Teléfono" name="customerPhone" required />
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Entrega</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold">
            <input className="h-4 w-4 accent-primary" defaultChecked name="fulfillmentMethod" type="radio" value="PICKUP" />
            Retiro en bodega
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold">
            <input className="h-4 w-4 accent-primary" name="fulfillmentMethod" type="radio" value="LOCAL_DELIVERY" />
            Envío local
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CheckoutField label="Dirección" name="addressLine1" />
          <CheckoutField label="Casa, local o referencia" name="addressLine2" />
          <label className="block text-sm font-semibold">
            Municipio
            <select className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm" name="city">
              <option value="">Selecciona municipio</option>
              <option value="Santa Tecla">Santa Tecla</option>
              <option value="San Salvador">San Salvador</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Departamento
            <select className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm" name="department">
              <option value="">Selecciona departamento</option>
              <option value="La Libertad">La Libertad</option>
              <option value="San Salvador">San Salvador</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm font-semibold">
          Notas de entrega
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            name="deliveryNotes"
            placeholder="Indicaciones, horario preferido o referencia del lugar"
          />
        </label>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Pago</h2>
        <label className="mt-4 flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold">
          <input className="h-4 w-4 accent-primary" defaultChecked name="paymentMethod" type="radio" value="online_card" />
          Tarjeta en línea
        </label>
      </section>

      <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white">
        <PackageCheck className="h-4 w-4" />
        Crear orden pendiente de pago
      </button>
    </form>
  );
}

function CheckoutField({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function EmptyCheckout({ hasIssues }: { hasIssues: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card p-8 text-center">
      <MapPin className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-4 text-xl font-bold text-primary">
        {hasIssues ? "Ajusta tu carrito" : "Tu carrito está vacío"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasIssues
          ? "Hay productos sin disponibilidad o cantidades superiores al stock."
          : "Agrega repuestos antes de completar la compra."}
      </p>
      <Link
        className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
        href={hasIssues ? "/cart" : "/catalog"}
      >
        {hasIssues ? "Volver al carrito" : "Ver catálogo"}
      </Link>
    </div>
  );
}

function CheckoutNotice({ message, status }: { message: string; status: string }) {
  const isError = status !== "created";

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    coverage_unavailable: "La zona seleccionada aún no está dentro de la cobertura inicial.",
    db_unavailable: "No pudimos crear la orden. Revisa que PostgreSQL esté activo.",
    invalid: "Revisa los datos del formulario.",
  };

  return messages[status] ?? "";
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
