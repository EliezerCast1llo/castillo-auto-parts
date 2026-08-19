import { cookies } from "next/headers";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CreditCard, Info, MapPin, PackageCheck } from "lucide-react";
import { CheckoutDeliveryFields } from "@/components/checkout/checkout-delivery-fields";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { getGuestCart } from "@/lib/cart";
import {
  CHECKOUT_RETRY_KEY_COOKIE,
  createCheckoutIdempotencyKey,
  normalizeCheckoutIdempotencyKey,
} from "@/lib/checkout-idempotency";
import { db } from "@/lib/db";
import { getFulfillmentOptions, type DeliveryZoneOption, type PickupLocationOption } from "@/lib/fulfillment";
import { formatCurrency } from "@/lib/money";
import { firstValue } from "@/lib/url-utils";
import { createGuestOrder } from "./actions";

export const metadata = {
  title: "Finalizar compra | Castillo Auto Parts",
  description: "Completa tus datos de entrega y pago para confirmar tu pedido.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const [cart, fulfillmentOptions, session] = await Promise.all([
    getGuestCart(),
    getFulfillmentOptions(),
    auth(),
  ]);
  const params = searchParams ? await searchParams : {};
  const status = firstValue(params.estado);
  const statusMessage = getStatusMessage(status);

  // Si venimos de un duplicate_in_progress, la action dejó la key original en un
  // cookie: se reutiliza para que el reintento reproduzca la orden en curso en vez
  // de crear una nueva (evita el dead-end y el duplicado).
  const cookieStore = await cookies();
  const retryKey = normalizeCheckoutIdempotencyKey(
    cookieStore.get(CHECKOUT_RETRY_KEY_COOKIE)?.value,
  );
  const idempotencyKey = retryKey ?? createCheckoutIdempotencyKey();

  let userDefaults: { name: string; email: string; phone: string } | null = null;
  let savedAddresses: { id: string; formattedAddress: string; addressLine1: string; addressLine2: string | null; city: string; department: string; deliveryNotes: string | null; latitude: string | null; longitude: string | null }[] = [];

  if (session?.user?.id) {
    const [dbUser, addresses] = await Promise.all([
      db.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, phone: true } }),
      db.address.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, select: { id: true, formattedAddress: true, addressLine1: true, addressLine2: true, city: true, department: true, deliveryNotes: true, latitude: true, longitude: true } }),
    ]);
    if (dbUser) {
      userDefaults = {
        name: dbUser.name ?? "",
        email: dbUser.email ?? "",
        phone: dbUser.phone ?? "",
      };
    }
    savedAddresses = addresses.map((a) => ({
      ...a,
      latitude: a.latitude?.toString() ?? null,
      longitude: a.longitude?.toString() ?? null,
    }));
  }

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ca-text-secondary transition hover:text-ca-navy-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al carrito
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Formulario */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-ca-border bg-white p-5 shadow-ca-soft">
              <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">
                Finalizar compra
              </p>
              <h1 className="mt-1 text-2xl font-black text-ca-navy-950">Datos de entrega y pago</h1>
            </div>

            {statusMessage ? <CheckoutNotice status={status} message={statusMessage} /> : null}

            {/* En duplicate_in_progress se oculta el form SOLO si no hay retryKey.
                Con retryKey el reintento reusa la misma key (reproduce, no duplica),
                así que es seguro mostrar el formulario de nuevo. */}
            {(status !== "duplicate_in_progress" || Boolean(retryKey)) &&
              (cart.lines.length > 0 && !cart.hasBlockingIssues ? (
              <CheckoutForm
                deliveryZones={fulfillmentOptions.deliveryZones}
                idempotencyKey={idempotencyKey}
                pickupLocation={fulfillmentOptions.pickupLocation}
                savedAddresses={savedAddresses}
                subtotalCents={cart.subtotalCents}
                userDefaults={userDefaults}
              />
            ) : (
              <EmptyCheckout hasIssues={cart.hasBlockingIssues} />
            ))}
          </div>

          {/* Resumen — sticky en desktop, visible debajo en mobile */}
          <aside className="h-fit rounded-2xl border border-ca-border bg-white p-5 shadow-ca-premium lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-ca-navy-950" strokeWidth={1.8} />
              <h2 className="text-lg font-black text-ca-navy-950">Tu pedido</h2>
            </div>

            <div className="mt-4 space-y-3">
              {cart.lines.map((line) => (
                <div className="flex items-start justify-between gap-3 text-sm" key={line.product.sku}>
                  <div className="min-w-0">
                    <p className="font-bold text-ca-navy-950 truncate">{line.product.name}</p>
                    <p className="text-ca-text-secondary">
                      {line.quantity} × {formatCurrency(line.product.priceCents)}
                    </p>
                  </div>
                  <p className="shrink-0 font-black text-ca-navy-950">
                    {formatCurrency(line.lineTotalCents)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-ca-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ca-text-secondary">Subtotal</span>
                <span className="text-xl font-black text-ca-navy-950">
                  {formatCurrency(cart.subtotalCents)}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-ca-background p-3 text-sm">
              <p className="font-bold text-ca-navy-950">Envío</p>
              <p className="mt-0.5 text-ca-text-secondary">
                Retiro gratis en {fulfillmentOptions.pickupLocation.name}
                {fulfillmentOptions.deliveryZones.length > 0
                  ? `; o envío ${formatDeliveryZoneSummary(fulfillmentOptions.deliveryZones)}.`
                  : "."}
              </p>
            </div>

            <div className="mt-3 flex gap-2 rounded-xl bg-ca-navy-950/5 p-3 text-sm font-semibold text-ca-navy-950">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Precios con IVA incluido (13%).
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

type SavedAddress = {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  department: string;
  deliveryNotes: string | null;
  latitude: string | null;
  longitude: string | null;
};

function CheckoutForm({
  deliveryZones,
  idempotencyKey,
  pickupLocation,
  savedAddresses,
  subtotalCents,
  userDefaults,
}: {
  deliveryZones: DeliveryZoneOption[];
  idempotencyKey: string;
  pickupLocation: PickupLocationOption;
  savedAddresses: SavedAddress[];
  subtotalCents: number;
  userDefaults: { name: string; email: string; phone: string } | null;
}) {
  const isGuest = userDefaults === null;

  return (
    <form action={createGuestOrder} className="space-y-4">
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-ca-soft">
        <h2 className="text-base font-black text-ca-navy-950">Tus datos</h2>
        {isGuest ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CheckoutField autoComplete="name" label="Nombre completo" name="customerName" required />
            <CheckoutField autoComplete="email" label="Email" name="customerEmail" required type="email" />
            <CheckoutField autoComplete="tel" label="Teléfono" name="customerPhone" required />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CheckoutFieldReadonly label="Nombre" value={userDefaults.name} />
            <CheckoutFieldReadonly label="Email" value={userDefaults.email} />
            {userDefaults.phone ? <CheckoutFieldReadonly label="Teléfono" value={userDefaults.phone} /> : null}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-ca-soft">
        <h2 className="text-base font-black text-ca-navy-950">Método de entrega</h2>
        <CheckoutDeliveryFields
          deliveryZones={deliveryZones}
          isGuest={isGuest}
          pickupLocation={pickupLocation}
          savedAddresses={savedAddresses}
          subtotalCents={subtotalCents}
        />
      </section>

      <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-ca-soft">
        <h2 className="text-base font-black text-ca-navy-950">Pago</h2>
        <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-ca-border bg-ca-background px-4 text-sm font-bold text-ca-navy-950">
          <input
            className="h-4 w-4 accent-ca-navy-950"
            defaultChecked
            name="paymentMethod"
            type="radio"
            value="online_card"
          />
          Tarjeta en línea
        </label>
      </section>

      <button className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-ca-button-hover transition hover:bg-ca-navy-800">
        <PackageCheck className="h-4 w-4" strokeWidth={2} />
        Confirmar y pagar
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
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-ca-navy-950">
        {label}
      </label>
      <input
        id={id}
        autoComplete={autoComplete}
        className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm text-ca-navy-950 outline-none focus:border-ca-navy-950"
        name={name}
        required={required}
        type={type}
      />
    </div>
  );
}

function CheckoutFieldReadonly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="block text-sm font-bold text-ca-navy-950">{label}</p>
      <p className="mt-2 flex h-11 items-center rounded-xl border border-ca-border bg-ca-background px-3 text-sm text-ca-text-secondary">
        {value || <span className="italic">Sin datos</span>}
      </p>
    </div>
  );
}

function EmptyCheckout({ hasIssues }: { hasIssues: boolean }) {
  return (
    <div className="rounded-2xl border border-ca-border bg-white p-10 text-center shadow-ca-soft">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ca-navy-950/5">
        <MapPin className="h-8 w-8 text-ca-navy-950" strokeWidth={1.5} />
      </div>
      <h2 className="mt-4 text-xl font-black text-ca-navy-950">
        {hasIssues ? "Ajusta tu carrito primero" : "Tu carrito está vacío"}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ca-text-secondary">
        {hasIssues
          ? "Hay productos sin disponibilidad. Revisa tu carrito antes de continuar."
          : "Agrega repuestos desde el catálogo para completar tu compra."}
      </p>
      <Link
        className="mt-5 inline-flex h-12 items-center justify-center rounded-[14px] bg-ca-navy-950 px-6 text-sm font-black text-white transition hover:bg-ca-navy-800"
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
      className={`flex gap-2 rounded-xl p-3 text-sm font-semibold ${
        isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
      }`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function formatDeliveryZoneSummary(zones: DeliveryZoneOption[]) {
  return zones.map((zone) => `${zone.name} ${formatCurrency(zone.feeCents)}`).join(", ");
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    coverage_unavailable: "La zona seleccionada aún no está dentro de la cobertura.",
    db_unavailable: "No pudimos crear el pedido. Intenta de nuevo.",
    duplicate_in_progress:
      "Tu pedido se está procesando. Espera unos segundos y vuelve a confirmar: se retomará el mismo pedido, no se duplica.",
    invalid: "Revisa los datos del formulario.",
    payment_unavailable: "No pudimos iniciar el pago. Intenta nuevamente.",
  };
  return messages[status] ?? "";
}
