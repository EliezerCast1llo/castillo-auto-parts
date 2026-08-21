import { Link, redirect } from "@/lib/i18n/navigation";
import { ArrowLeft, MapPin, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AddAddressModal } from "@/components/account/add-address-modal";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFulfillmentOptions } from "@/lib/fulfillment";
import { firstValue } from "@/lib/url-utils";
import { deleteAddress } from "@/lib/actions/account-addresses";

import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getStatusMessage } from "@/lib/i18n/status";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Account.addresses" });

  return { title: t("metadataTitle") };
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Tono del aviso por código. El texto vive en `Status.addresses`; acá solo
 * queda si el resultado fue bueno o malo, que es comportamiento y no cambia
 * con el idioma.
 */
const NOTICE_IS_SUCCESS: Record<string, boolean> = {
  created: true,
  deleted: true,
  missing_fields: false,
  invalid_department: false,
};

export default async function AccountAddressesPage({
  params: routeParams,
  searchParams,
}: Props) {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const session = await auth();
  if (!session?.user?.id) {
    return redirect({ href: { pathname: "/auth/login", query: { next: "/account/addresses" } }, locale });
  }

  const params = searchParams ? await searchParams : {};
  const estado = firstValue(params.estado) ?? "";
  const noticeMessage = await getStatusMessage("addresses", estado, locale);
  const noticeIsSuccess = NOTICE_IS_SUCCESS[estado] ?? false;
  const t = await getTranslations({ locale, namespace: "Account.addresses" });

  const [addresses, fulfillmentOptions] = await Promise.all([
    db.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    getFulfillmentOptions(),
  ]);

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader locale={locale} />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ca-text-secondary transition hover:text-ca-navy-950"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToAccount")}
        </Link>

        <div className="mt-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-ca-navy-950">{t("title")}</h1>
          <AddAddressModal deliveryZones={fulfillmentOptions.deliveryZones} />
        </div>

        {noticeMessage ? (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
              noticeIsSuccess
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {noticeMessage}
          </div>
        ) : null}

        {addresses.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-ca-border bg-white py-14 text-center shadow-ca-soft">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ca-navy-950/[0.07] text-ca-navy-950">
              <MapPin className="h-7 w-7" strokeWidth={1.6} />
            </span>
            <div>
              <p className="font-black text-ca-navy-950">{t("emptyTitle")}</p>
              <p className="mt-1 max-w-xs text-sm text-ca-text-secondary">
                {t("emptyDescription")}
              </p>
            </div>
            <AddAddressModal deliveryZones={fulfillmentOptions.deliveryZones} />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-2xl border border-ca-border bg-white p-4 shadow-ca-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ca-navy-950/[0.07] text-ca-navy-950">
                      <MapPin className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ca-navy-950">{address.addressLine1}</p>
                      {address.addressLine2 ? (
                        <p className="text-sm text-ca-text-secondary">{address.addressLine2}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-ca-text-secondary">
                        {address.city}, {address.department} · El Salvador
                      </p>
                      {address.deliveryNotes ? (
                        <p className="mt-1 text-xs italic text-ca-text-secondary">
                          &ldquo;{address.deliveryNotes}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button
                      type="submit"
                      aria-label={t("delete")}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-ca-border text-ca-text-secondary transition hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
