import Link from "next/link";
import { AlertCircle, ArrowLeft, CreditCard, Info, MapPin, PackageCheck } from "lucide-react";
import { CheckoutDeliveryFields } from "@/components/checkout/checkout-delivery-fields";
import { SiteHeader } from "@/components/site-header";
import { getGuestCart } from "@/lib/cart";
import { getFulfillmentOptions, type DeliveryZoneOption, type PickupLocationOption } from "@/lib/fulfillment";
import { formatCurrency } from "@/lib/money";
import { firstValue } from "@/lib/url-utils";
import { createGuestOrder } from "./actions";

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
  const fulfillmentOptions = await getFulfillmentOptions();
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
                Completa tus datos para confirmar la compra. En este MVP simularemos el pago en línea para dejar la orden lista para entrega.
              </p>
            </div>

            {statusMessage ? <CheckoutNotice status={status} message={statusMessage} /> : null}

            {cart.lines.length > 0 && !cart.hasBlockingIssues ? (
              <CheckoutForm
                deliveryZones={fulfillmentOptions.deliveryZones}
                pickupLocation={fulfillmentOptions.pickupLocation}
                subtotalCents={cart.subtotalCents}
              />
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
              <SummaryRow label="Productos" value={formatCurrency(cart.subtotalCents)} strong />
            </dl>

            <div className="mt-4 rounded-md bg-background p-3 text-sm">
              <p className="font-semibold text-primary">Envío</p>
              <p className="mt-1 text-muted-foreground">
                Retiro gratis en {fulfillmentOptions.pickupLocation.name}
                {fulfillmentOptions.deliveryZones.length > 0
                  ? `; ${formatDeliveryZoneSummary(fulfillmentOptions.deliveryZones)}.`
                  : "; envío local pendiente de configurar."}
              </p>
            </div>

            <div className="mt-4 flex gap-2 rounded-md bg-primary/5 p-3 text-sm font-semibold text-primary">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Los precios ya incluyen IVA.
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function CheckoutForm({
  deliveryZones,
  pickupLocation,
  subtotalCents,
}: {
  deliveryZones: DeliveryZoneOption[];
  pickupLocation: PickupLocationOption;
  subtotalCents: number;
}) {
  return (
    <form action={createGuestOrder} className="space-y-4">
      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Cliente</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CheckoutField autoComplete="name" label="Nombre completo" name="customerName" required />
          <CheckoutField autoComplete="email" label="Email" name="customerEmail" required type="email" />
          <CheckoutField autoComplete="tel" label="Teléfono" name="customerPhone" required />
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Entrega</h2>
        <CheckoutDeliveryFields
          deliveryZones={deliveryZones}
          pickupLocation={pickupLocation}
          subtotalCents={subtotalCents}
        />
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
        Pagar en línea y confirmar orden
      </button>
    </form>
  );
}

function CheckoutField({
  autoComplete,
  label,
  name,
  required,
  type = "text",
}: {
  autoComplete?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        autoComplete={autoComplete}
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

function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "text-xl font-bold text-primary" : "font-semibold"}>{value}</dd>
    </div>
  );
}

function formatDeliveryZoneSummary(zones: DeliveryZoneOption[]) {
  return zones.map((zone) => `${zone.name} ${formatCurrency(zone.feeCents)}`).join(", ");
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    coverage_unavailable: "La zona seleccionada aún no está dentro de la cobertura inicial.",
    db_unavailable: "No pudimos crear la orden. Revisa que PostgreSQL esté activo.",
    invalid: "Revisa los datos del formulario.",
    payment_unavailable: "No pudimos confirmar el pago en línea. Intenta nuevamente.",
  };

  return messages[status] ?? "";
}

