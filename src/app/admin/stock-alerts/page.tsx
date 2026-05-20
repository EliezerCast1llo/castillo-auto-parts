import { BellRing } from "lucide-react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { requireAdminAccess } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Avisos de stock | Castillo Auto Parts",
};

export default async function AdminStockAlertsPage() {
  await requireAdminAccess("/admin/stock-alerts");

  const alerts = await db.stockAlertRequest.findMany({
    include: {
      product: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-md border border-border bg-card p-5">
          <p className="text-sm font-semibold text-success">Admin protegido</p>
          <div className="mt-1 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-bold text-primary">Avisos de disponibilidad</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Clientes que pidieron ser contactados cuando haya stock suficiente.
              </p>
            </div>
            <AdminNav active="stock-alerts" />
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-md border border-border bg-card shadow-[0_16px_40px_rgba(18,50,74,0.08)]">
          {alerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-background text-left text-xs font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Cantidad</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-4 py-4">
                        <p className="font-bold text-primary">{alert.productNameSnapshot}</p>
                        <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                          SKU {alert.skuSnapshot}
                        </p>
                        {alert.product?.slug ? (
                          <Link
                            className="mt-2 inline-flex text-xs font-bold text-success"
                            href={`/admin/products/${alert.product.slug}/edit`}
                          >
                            Ver producto
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <p>{alert.email ?? "Sin email"}</p>
                        <p className="mt-1 text-muted-foreground">{alert.phone ?? "Sin teléfono"}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold">{alert.requestedQuantity}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
                          {formatAlertStatus(alert.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDate(alert.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <BellRing className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-xl font-bold text-primary">Sin solicitudes pendientes</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Cuando un cliente pida aviso por stock, aparecerá en esta vista.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatAlertStatus(status: string) {
  const labels: Record<string, string> = {
    CANCELLED: "Cancelado",
    NOTIFIED: "Notificado",
    OPEN: "Pendiente",
  };

  return labels[status] ?? status;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
