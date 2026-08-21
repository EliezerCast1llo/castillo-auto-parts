import { cookies } from "next/headers";
import { Link } from "@/lib/i18n/navigation";
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
import { getStatusMessage } from "@/lib/i18n/status";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Checkout.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

type CheckoutTranslator = Awaited<ReturnType<typeof getTranslations<"Checkout">>>;

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ params: routeParams, searchParams }: CheckoutPageProps) {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const [cart, fulfillmentOptions, session] = await Promise.all([
    getGuestCart(),
    getFulfillmentOptions(),
    auth(),
  ]);
  const params = searchParams ? await searchParams : {};
  const status = firstValue(params.estado);
  const statusMessage = await getStatusMessage("checkout", status, locale);
  const t = await getTranslations({ locale, namespace: "Checkout" });

  // La key de reintento se adopta cuando el carrito NO está vacío. Con carrito lleno
  // una key vieja es inofensiva: isSameCheckoutIntent + la key derivada evitan pisar
  // otra orden. El caso peligroso era el carrito VACÍO (el atajo de sameIntent
  // reproduciría la orden vieja), y ahí sí se ignora. El discriminante es el carrito,
  // no el query param: volver a /checkout sin ?estado con la orden en vuelo debe
  // reusar la key, no acuñar una nueva y duplicar.
  const cookieStore = await cookies();
  const retryKey =
    cart.lines.length > 0
      ? normalizeCheckoutIdempotencyKey(cookieStore.get(CHECKOUT_RETRY_KEY_COOKIE)?.value)
      : undefined;
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
      <SiteHeader locale={locale} />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ca-text-secondary transition hover:text-ca-navy-950"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToCart")}
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Formulario */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-ca-border bg-white p-5 shadow-ca-soft">
              <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">
                {t("eyebrow")}
              </p>
              <h1 className="mt-1 text-2xl font-black text-ca-navy-950">{t("title")}</h1>
            </div>

            {statusMessage ? <CheckoutNotice status={status} message={statusMessage} /> : null}

            {/* El form se muestra siempre que haya carrito utilizable. En
                duplicate_in_progress el reintento reusa la key de la cookie
                (reproduce, no duplica), así que no hace falta ocultarlo. */}
            {cart.lines.length > 0 && !cart.hasBlockingIssues ? (
              <CheckoutForm
                deliveryZones={fulfillmentOptions.deliveryZones}
                idempotencyKey={idempotencyKey}
                pickupLocation={fulfillmentOptions.pickupLocation}
                savedAddresses={savedAddresses}
                subtotalCents={cart.subtotalCents}
                t={t}
                userDefaults={userDefaults}
              />
            ) : (
              <EmptyCheckout hasIssues={cart.hasBlockingIssues} t={t} />
            )}
          </div>

          {/* Resumen — sticky en desktop, visible debajo en mobile */}
          <aside className="h-fit rounded-2xl border border-ca-border bg-white p-5 shadow-ca-premium lg:sticky lg:top-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-ca-navy-950" strokeWidth={1.8} />
              <h2 className="text-lg font-black text-ca-navy-950">{t("summary.title")}</h2>
            </div>

            <div className="mt-4 space-y-3">
              {cart.lines.map((line) => (
                <div className="flex items-start justify-between gap-3 text-sm" key={line.product.sku}>
                  <div className="min-w-0">
                    <p className="font-bold text-ca-navy-950 truncate">{line.product.name}</p>
                    <p className="text-ca-text-secondary">
                      {line.quantity} × {formatCurrency(line.product.priceCents, locale)}
                    </p>
                  </div>
                  <p className="shrink-0 font-black text-ca-navy-950">
                    {formatCurrency(line.lineTotalCents, locale)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-ca-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ca-text-secondary">{t("summary.subtotal")}</span>
                <span className="text-xl font-black text-ca-navy-950">
                  {formatCurrency(cart.subtotalCents, locale)}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-ca-background p-3 text-sm">
              <p className="font-bold text-ca-navy-950">{t("summary.shippingTitle")}</p>
              <p className="mt-0.5 text-ca-text-secondary">
                {fulfillmentOptions.deliveryZones.length > 0
                  ? t("summary.pickupOrDelivery", {
                      location: fulfillmentOptions.pickupLocation.name,
                      zones: formatDeliveryZoneSummary(fulfillmentOptions.deliveryZones, locale),
                    })
                  : `${t("summary.pickupFree", { location: fulfillmentOptions.pickupLocation.name })}.`}
              </p>
            </div>

            <div className="mt-3 flex gap-2 rounded-xl bg-ca-navy-950/5 p-3 text-sm font-semibold text-ca-navy-950">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {t("summary.taxNotice")}
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
  t,
  userDefaults,
}: {
  deliveryZones: DeliveryZoneOption[];
  idempotencyKey: string;
  pickupLocation: PickupLocationOption;
  savedAddresses: SavedAddress[];
  subtotalCents: number;
  t: CheckoutTranslator;
  userDefaults: { name: string; email: string; phone: string } | null;
}) {
  const isGuest = userDefaults === null;

  return (
    <form action={createGuestOrder} className="space-y-4">
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-ca-soft">
        <h2 className="text-base font-black text-ca-navy-950">{t("form.yourData")}</h2>
        {isGuest ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CheckoutField
              autoComplete="name"
              label={t("form.fullName")}
              name="customerName"
              required
            />
            <CheckoutField
              autoComplete="email"
              label={t("form.email")}
              name="customerEmail"
              required
              type="email"
            />
            <CheckoutField autoComplete="tel" label={t("form.phone")} name="customerPhone" required />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CheckoutFieldReadonly
              emptyLabel={t("form.noData")}
              label={t("form.name")}
              value={userDefaults.name}
            />
            <CheckoutFieldReadonly
              emptyLabel={t("form.noData")}
              label={t("form.email")}
              value={userDefaults.email}
            />
            {userDefaults.phone ? (
              <CheckoutFieldReadonly
                emptyLabel={t("form.noData")}
                label={t("form.phone")}
                value={userDefaults.phone}
              />
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-ca-soft">
        <h2 className="text-base font-black text-ca-navy-950">{t("form.deliveryMethod")}</h2>
        <CheckoutDeliveryFields
          deliveryZones={deliveryZones}
          isGuest={isGuest}
          pickupLocation={pickupLocation}
          savedAddresses={savedAddresses}
          subtotalCents={subtotalCents}
        />
      </section>

      <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-ca-soft">
        <h2 className="text-base font-black text-ca-navy-950">{t("form.payment")}</h2>
        <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-ca-border bg-ca-background px-4 text-sm font-bold text-ca-navy-950">
          <input
            className="h-4 w-4 accent-ca-navy-950"
            defaultChecked
            name="paymentMethod"
            type="radio"
            value="online_card"
          />
          {t("form.card")}
        </label>
      </section>

      <button className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-ca-button-hover transition hover:bg-ca-navy-800">
        <PackageCheck className="h-4 w-4" strokeWidth={2} />
        {t("form.submit")}
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

function CheckoutFieldReadonly({
  emptyLabel,
  label,
  value,
}: {
  emptyLabel: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="block text-sm font-bold text-ca-navy-950">{label}</p>
      <p className="mt-2 flex h-11 items-center rounded-xl border border-ca-border bg-ca-background px-3 text-sm text-ca-text-secondary">
        {value || <span className="italic">{emptyLabel}</span>}
      </p>
    </div>
  );
}

function EmptyCheckout({ hasIssues, t }: { hasIssues: boolean; t: CheckoutTranslator }) {
  return (
    <div className="rounded-2xl border border-ca-border bg-white p-10 text-center shadow-ca-soft">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ca-navy-950/5">
        <MapPin className="h-8 w-8 text-ca-navy-950" strokeWidth={1.5} />
      </div>
      <h2 className="mt-4 text-xl font-black text-ca-navy-950">
        {hasIssues ? t("empty.issuesTitle") : t("empty.emptyTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ca-text-secondary">
        {hasIssues ? t("empty.issuesDescription") : t("empty.emptyDescription")}
      </p>
      <Link
        className="mt-5 inline-flex h-12 items-center justify-center rounded-[14px] bg-ca-navy-950 px-6 text-sm font-black text-white transition hover:bg-ca-navy-800"
        href={hasIssues ? "/cart" : "/catalog"}
      >
        {hasIssues ? t("empty.issuesAction") : t("empty.emptyAction")}
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

function formatDeliveryZoneSummary(zones: DeliveryZoneOption[], locale: Locale) {
  return zones.map((zone) => `${zone.name} ${formatCurrency(zone.feeCents, locale)}`).join(", ");
}

