import Link from "next/link";
import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AddAddressForm } from "@/components/account/add-address-form";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFulfillmentOptions } from "@/lib/fulfillment";
import { firstValue } from "@/lib/url-utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mis direcciones | Castillo Auto Parts" };

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountAddressesPage({ searchParams }: PageProps) {
  const session = await auth();

  const [addresses, fulfillmentOptions] = await Promise.all([
    db.address.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
    }),
    getFulfillmentOptions(),
  ]);

  const params = searchParams ? await searchParams : {};
  const estado = firstValue(params.estado);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" />
            Mi cuenta
          </Link>
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-primary">Mis direcciones</h1>
        </div>

        {estado === "added" ? (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            Dirección guardada correctamente.
          </div>
        ) : estado === "invalid" ? (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            Revisa los datos antes de guardar.
          </div>
        ) : null}

        {addresses.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-md border border-border bg-card py-12 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-primary">Sin direcciones guardadas</p>
            <p className="text-sm text-muted-foreground">
              Agrega tu primera dirección de entrega.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-md border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">{address.formattedAddress}</p>
                    {address.addressLine2 ? (
                      <p className="text-sm text-muted-foreground">{address.addressLine2}</p>
                    ) : null}
                    {address.deliveryNotes ? (
                      <p className="mt-1 text-xs text-muted-foreground">{address.deliveryNotes}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {address.city}, {address.department}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-ca-navy-950" />
            <h2 className="text-lg font-bold text-ca-navy-950">Agregar nueva dirección</h2>
          </div>
          <div className="mt-4 rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)]">
            <AddAddressForm deliveryZones={fulfillmentOptions.deliveryZones} />
          </div>
        </div>
      </div>
    </main>
  );
}
