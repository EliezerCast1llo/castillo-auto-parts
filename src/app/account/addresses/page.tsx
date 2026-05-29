import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mis direcciones | Castillo Auto Parts" };

export default async function AccountAddressesPage() {
  const session = await auth();

  const addresses = await db.address.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

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

        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Mis direcciones</h1>
        </div>

        {addresses.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-md border border-border bg-card py-12 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-primary">Sin direcciones guardadas</p>
            <p className="text-sm text-muted-foreground">
              Tus direcciones de entrega se guardarán automáticamente al hacer una compra.
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
      </div>
    </main>
  );
}
