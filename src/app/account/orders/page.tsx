import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { formatDateTime, formatOrderStatus, getOrderStatusClassName } from "@/lib/order-formatters";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis órdenes | Castillo Auto Parts",
  description: "Historial de compras en Castillo Auto Parts.",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const session = await auth();

  const orders = await db.order.findMany({
    where: { userId: session!.user.id },
    include: { items: true },
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

        <h1 className="mt-4 text-2xl font-bold text-primary">Mis órdenes</h1>

        {orders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-md border border-border bg-card py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-primary">Aún no tienes órdenes</p>
            <p className="text-sm text-muted-foreground">
              Cuando realices una compra, aparecerá aquí.
            </p>
            <Link
              href="/catalog"
              className="mt-2 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-md border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                    <p className="mt-0.5 font-bold text-primary">{order.orderNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${getOrderStatusClassName(order.status)}`}
                    >
                      {formatOrderStatus(order.status)}
                    </span>
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(order.totalCents)}
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
                  {" · "}
                  {order.items.map((i) => i.productNameSnapshot).join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
