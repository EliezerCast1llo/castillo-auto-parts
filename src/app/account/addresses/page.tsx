import Link from "next/link";
import { ArrowLeft, MapPin, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { AddAddressModal } from "@/components/account/add-address-modal";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFulfillmentOptions } from "@/lib/fulfillment";
import { firstValue } from "@/lib/url-utils";
import { deleteAddress } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mis direcciones | Castillo Auto Parts" };

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusMessages: Record<string, { msg: string; ok: boolean }> = {
  created: { msg: "Dirección guardada correctamente.", ok: true },
  deleted: { msg: "Dirección eliminada.", ok: true },
  missing_fields: { msg: "Completa los campos obligatorios.", ok: false },
  invalid_department: { msg: "Selecciona un departamento válido.", ok: false },
};

export default async function AccountAddressesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?next=/account/addresses");

  const params = searchParams ? await searchParams : {};
  const estado = firstValue(params.estado) ?? "";
  const notice = statusMessages[estado];

  const [addresses, fulfillmentOptions] = await Promise.all([
    db.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    getFulfillmentOptions(),
  ]);

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ca-text-secondary transition hover:text-ca-navy-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Mi cuenta
        </Link>

        <div className="mt-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-ca-navy-950">Mis direcciones</h1>
          <AddAddressModal deliveryZones={fulfillmentOptions.deliveryZones} />
        </div>

        {notice ? (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
              notice.ok
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {notice.msg}
          </div>
        ) : null}

        {addresses.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-ca-border bg-white py-14 text-center shadow-[var(--ca-shadow-soft)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ca-navy-950/[0.07] text-ca-navy-950">
              <MapPin className="h-7 w-7" strokeWidth={1.6} />
            </span>
            <div>
              <p className="font-black text-ca-navy-950">Sin direcciones guardadas</p>
              <p className="mt-1 max-w-xs text-sm text-ca-text-secondary">
                Guarda una dirección para agilizar tus próximas compras.
              </p>
            </div>
            <AddAddressModal deliveryZones={fulfillmentOptions.deliveryZones} />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-2xl border border-ca-border bg-white p-4 shadow-[var(--ca-shadow-soft)]"
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
                      aria-label="Eliminar dirección"
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
