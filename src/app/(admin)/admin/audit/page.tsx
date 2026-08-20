import { ClipboardList } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { defaultLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Auditoría admin | Castillo Auto Parts",
};

export default async function AdminAuditPage() {
  const adminUser = await requireAdminRole("ADMIN");

  const logs = await db.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={defaultLocale} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-md border border-border bg-card p-5">
          <p className="text-sm font-semibold text-success">Admin protegido</p>
          <div className="mt-1 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-bold text-primary">Auditoría</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Últimos cambios operativos realizados en productos, inventario, órdenes y ajustes.
              </p>
            </div>
            <AdminNav active="audit" user={adminUser} />
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-md border border-border bg-card shadow-ca-card">
          {logs.length > 0 ? (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <article className="grid gap-3 p-4 lg:grid-cols-[220px_minmax(0,1fr)_220px]" key={log.id}>
                  <div>
                    <p className="text-sm font-bold text-primary">{formatAuditAction(log.action)}</p>
                    <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                      {log.entityType}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground">{log.entityLabel ?? log.entityId ?? "Sin referencia"}</p>
                    {log.metadata ? (
                      <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-background p-3 text-xs leading-5 text-muted-foreground">
                        {formatMetadata(log.metadata)}
                      </pre>
                    ) : null}
                  </div>

                  <p className="text-sm font-semibold text-muted-foreground lg:text-right">
                    {formatDate(log.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-xl font-bold text-primary">Aún no hay eventos</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Los cambios administrativos aparecerán aquí cuando se creen o actualicen datos operativos.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatAuditAction(action: string) {
  const labels: Record<string, string> = {
    "delivery_zone.created": "Zona creada",
    "delivery_zone.updated": "Zona actualizada",
    "inventory.updated": "Inventario actualizado",
    "order.status_updated": "Estado de orden actualizado",
    "product.created": "Producto creado",
    "product.updated": "Producto actualizado",
    "settings.pickup.updated": "Retiro actualizado",
    "stock_alert.status_updated": "Aviso de stock actualizado",
  };

  return labels[action] ?? action;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMetadata(value: unknown) {
  return JSON.stringify(value, null, 2);
}
