import { CreditCard, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/money";
import { isMockPaymentAvailable } from "@/lib/payments/mock-access";
import { firstValue } from "@/lib/url-utils";
import { confirmMockPayment } from "./actions";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";

export const dynamic = "force-dynamic";

type MockPaymentPageProps = {
  params: Promise<{ externalPaymentId: string; locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MockPaymentPage({ params, searchParams }: MockPaymentPageProps) {
  const locale = await resolveAndPublishRouteLocale(params);
  if (!isMockPaymentAvailable()) notFound();
  const { externalPaymentId } = await params;
  const query = searchParams ? await searchParams : {};
  const returnTo = firstValue(query.returnTo);
  if (!returnTo) notFound();

  const payment = await db.payment.findFirst({
    include: { order: { select: { orderNumber: true } } },
    where: { externalPaymentId, provider: "mock" },
  });
  if (!payment) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={locale} />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_50px_rgba(6,25,51,0.1)] sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CreditCard className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase text-muted-foreground">
            Entorno de desarrollo
          </p>
          <h1 className="mt-2 text-2xl font-bold text-primary">Simulación de pago</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esta pantalla representa la confirmación asíncrona que enviará el proveedor de pago.
          </p>

          <dl className="mt-6 space-y-3 rounded-xl bg-background p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Orden</dt>
              <dd className="font-semibold">{payment.order.orderNumber}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-bold text-primary">{formatCurrency(payment.amountCents)}</dd>
            </div>
          </dl>

          <form action={confirmMockPayment} className="mt-6">
            <input name="externalPaymentId" type="hidden" value={externalPaymentId} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
              type="submit"
            >
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Simular pago aprobado
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
