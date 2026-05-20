import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

const popularSearches = [
  {
    label: "Amortiguadores",
    description: "Alta intención para suspensión y reemplazo preventivo.",
    href: "/catalog?q=amortiguadores",
  },
  {
    label: "Pastillas de freno",
    description: "Compra frecuente con decisión por compatibilidad.",
    href: "/catalog?q=pastillas%20de%20freno",
  },
  {
    label: "Filtro de aceite",
    description: "SKU de mantenimiento ideal para catálogo inicial.",
    href: "/catalog?q=filtro%20de%20aceite",
  },
  {
    label: "Toyota Corolla",
    description: "Búsqueda por vehículo para encontrar piezas compatibles.",
    href: "/catalog?vehicleMake=Toyota&vehicleModel=Corolla",
  },
];

export function PopularSearches() {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-semibold text-success">Lo más buscado</p>
          <h2 className="text-lg font-bold text-primary">Atajos para validar demanda</h2>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {popularSearches.map((search) => (
          <Link
            key={search.label}
            className="group flex min-h-28 flex-col justify-between rounded-md border border-border bg-background p-3 transition hover:border-primary hover:bg-primary/5"
            href={search.href}
          >
            <span>
              <span className="block text-sm font-bold text-primary">{search.label}</span>
              <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                {search.description}
              </span>
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
              Ver productos
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
