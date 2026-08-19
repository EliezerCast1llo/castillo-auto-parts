import { Link } from "@/lib/i18n/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Headphones,
  PackageSearch,
  Phone,
} from "lucide-react";
import { redirect } from "next/navigation";
import {
  AccountOrderCard,
  accountOrderCardInclude,
} from "@/components/account/account-order-card";
import { EmptyState } from "@/components/empty-state";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { auth } from "@/lib/auth";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis pedidos | Castillo Auto Parts",
  description: "Historial de compras en Castillo Auto Parts.",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?next=/account/orders");

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: accountOrderCardInclude,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              className="inline-flex items-center gap-2 text-sm font-black text-ca-navy-950 transition hover:text-ca-blue-700"
              href="/account"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Mi cuenta
            </Link>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-ca-navy-950 sm:text-4xl">
              Mis pedidos
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-ca-text-secondary">
              Consulta el estado de tus pedidos y el historial de compras.
            </p>
          </div>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-ca-border bg-white px-4 text-sm font-black text-ca-navy-950 shadow-[var(--ca-shadow-soft)] transition hover:border-ca-blue-700/30 hover:bg-white sm:w-auto"
            type="button"
          >
            <CalendarDays className="h-4 w-4" strokeWidth={1.9} />
            Últimos 6 meses
            <ChevronDown className="h-4 w-4" strokeWidth={1.9} />
          </button>
        </div>

        {orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <AccountOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        <OrderHelpCard />
      </div>
    </main>
  );
}

function EmptyOrders() {
  return (
    <div className="mt-8">
      <EmptyState
        actionHref="/catalog"
        actionLabel="Ver catálogo"
        description="Cuando compres un repuesto, podrás consultar aquí el estado, fecha estimada y detalle de entrega."
        icon={<PackageSearch className="h-7 w-7" strokeWidth={1.8} />}
        showWhatsApp
        title="Todavía no tienes pedidos"
      />
    </div>
  );
}

function OrderHelpCard() {
  return (
    <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ca-background text-ca-navy-950">
          <Headphones className="h-7 w-7" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-base font-black text-ca-navy-950">
            ¿Necesitas ayuda con tu pedido?
          </h2>
          <p className="mt-1 text-sm font-medium text-ca-text-secondary">
            Nuestro equipo está para ayudarte.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:flex sm:items-center">
        <WhatsAppCTA
          className="h-11 justify-center"
          label="Contactar asesor"
          phone={SUPPORT_WHATSAPP_NUMBER}
          variant="subtle"
        />
        {SUPPORT_WHATSAPP_NUMBER ? (
          <a
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ca-border bg-white px-4 text-sm font-black text-ca-navy-950 transition hover:bg-ca-background"
            href={`tel:+${SUPPORT_WHATSAPP_NUMBER}`}
          >
            <Phone className="h-4 w-4" strokeWidth={1.9} />
            +{SUPPORT_WHATSAPP_NUMBER}
          </a>
        ) : null}
      </div>
    </section>
  );
}
