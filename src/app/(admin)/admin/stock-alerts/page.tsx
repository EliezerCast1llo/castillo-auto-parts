import { BellRing } from "lucide-react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { stockAlertStatuses, parseStockAlertStatus } from "@/lib/stock-alerts";
import { updateStockAlertStatus } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Avisos de stock | Castillo Auto Parts",
};

type AdminStockAlertsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminStockAlertsPage({ searchParams }: AdminStockAlertsPageProps) {
  const adminUser = await requireAdminRole("ADMIN", "SUPPORT", "WAREHOUSE");

  const params = searchParams ? await searchParams : {};
  const selectedStatus = parseStockAlertStatus(firstValue(params.estado_alerta));
  const statusMessage = getStatusMessage(firstValue(params.estado));
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
    where: selectedStatus ? { status: selectedStatus } : undefined,
  });
  const counts = await db.stockAlertRequest.groupBy({
    by: ["status"],
    _count: { status: true },
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
            <div className="flex flex-col gap-3 sm:items-end">
              <AdminNav active="stock-alerts" user={adminUser} />
              <StatusFilter selectedStatus={selectedStatus} />
            </div>
          </div>
        </section>

        {statusMessage ? (
          <AdminStockAlertsNotice isError={isErrorStatus(firstValue(params.estado))} message={statusMessage} />
        ) : null}

        <section className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {stockAlertStatuses.map((status) => (
            <MetricCard
              key={status}
              label={formatAlertStatus(status)}
              value={String(getStatusCount(counts, status))}
            />
          ))}
        </section>

        <section className="mt-5 overflow-hidden rounded-md border border-border bg-card shadow-ca-card">
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
                    <th className="px-4 py-3">Acción</th>
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
                      <td className="px-4 py-4">
                        <form action={updateStockAlertStatus} className="flex min-w-52 gap-2">
                          <input name="alertId" type="hidden" value={alert.id} />
                          <select
                            className="h-10 rounded-md border border-border bg-background px-2 text-sm"
                            defaultValue={alert.status}
                            name="status"
                          >
                            {stockAlertStatuses.map((status) => (
                              <option key={status} value={status}>
                                {formatAlertStatus(status)}
                              </option>
                            ))}
                          </select>
                          <button className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-white">
                            Guardar
                          </button>
                        </form>
                      </td>
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

function StatusFilter({ selectedStatus }: { selectedStatus: string | null }) {
  return (
    <form className="flex flex-wrap gap-2">
      <select
        className="h-10 rounded-md border border-border bg-card px-3 text-sm font-semibold text-primary"
        defaultValue={selectedStatus ?? ""}
        name="estado_alerta"
      >
        <option value="">Todos los estados</option>
        {stockAlertStatuses.map((status) => (
          <option key={status} value={status}>
            {formatAlertStatus(status)}
          </option>
        ))}
      </select>
      <button className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-white">
        Filtrar
      </button>
    </form>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function AdminStockAlertsNotice({ isError, message }: { isError: boolean; message: string }) {
  return (
    <div
      className={`mt-5 rounded-md p-3 text-sm font-semibold ${
        isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
      }`}
    >
      {message}
    </div>
  );
}

function formatAlertStatus(status: string) {
  const labels: Record<string, string> = {
    CANCELLED: "Cancelado",
    CLOSED: "Cerrado",
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

function getStatusCount(
  counts: Array<{ status: string; _count: { status: number } }>,
  status: string,
) {
  return counts.find((item) => item.status === status)?._count.status ?? 0;
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    db_unavailable: "No pudimos actualizar el aviso. Revisa la conexión de base de datos.",
    invalid: "Selecciona un estado válido.",
    not_found: "No encontramos ese aviso.",
    updated: "Aviso actualizado.",
  };

  return messages[status] ?? "";
}

function isErrorStatus(status: string) {
  return ["db_unavailable", "invalid", "not_found"].includes(status);
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
