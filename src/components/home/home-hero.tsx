import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, ShoppingCart } from "lucide-react";

const signals = [
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    label: "Compatibilidad clara",
    detail: "SKU, parte y vehículo visibles antes de pagar.",
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    label: "Entrega local",
    detail: "Retiro en bodega, San Salvador y Santa Tecla.",
  },
  {
    icon: <ShoppingCart className="h-5 w-5" />,
    label: "Compra invitada",
    detail: "Sin crear cuenta para completar la primera compra.",
  },
];

export function HomeHero() {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-5 md:p-7">
          <p className="text-sm font-semibold text-success">Castillo Auto Parts</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-primary md:text-4xl">
            Compra repuestos con compatibilidad clara antes de pagar
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Catálogo automotriz para El Salvador con stock visible, búsqueda por número de parte y
            opciones de retiro en bodega o envío local.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white"
            >
              Ver catálogo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/catalog"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary"
            >
              Buscar por vehículo
            </Link>
          </div>
        </div>

        <aside className="border-t border-border bg-card p-5 text-foreground lg:border-l lg:border-t-0 md:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-md border border-primary/15 bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-primary">Compra con menos dudas</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                El catálogo está pensado para comparar compatibilidad, precio y disponibilidad sin
                abrir demasiadas pantallas.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {signals.map((signal) => (
              <div className="flex gap-3 rounded-md border border-border bg-background p-3" key={signal.label}>
                <span className="text-success">{signal.icon}</span>
                <div>
                  <p className="text-sm font-bold text-foreground">{signal.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{signal.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
