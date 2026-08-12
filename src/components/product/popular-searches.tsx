import Link from "next/link";
import { ArrowRight, Disc3, Filter, Gauge, PlugZap } from "lucide-react";

const popularSearches = [
  {
    icon: Filter,
    label: "Filtros de aceite",
    description: "Mantén tu motor siempre protegido",
    href: "/catalog?q=filtro%20de%20aceite",
  },
  {
    icon: Disc3,
    label: "Pastillas de freno",
    description: "Seguridad en cada kilómetro",
    href: "/catalog?q=pastillas%20de%20freno",
  },
  {
    icon: PlugZap,
    label: "Bujías",
    description: "Encendido confiable y mejor rendimiento",
    href: "/catalog?q=bujías",
  },
  {
    icon: Gauge,
    label: "Amortiguadores",
    description: "Estabilidad y confort en cada viaje",
    href: "/catalog?q=amortiguadores",
  },
];

export function PopularSearches() {
  return (
    <section className="rounded-ca-surface border border-ca-border bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-ca-navy-950">Lo más buscado</h2>
        <Link className="inline-flex shrink-0 items-center gap-2 text-sm font-black text-ca-blue-700" href="/catalog">
          Ver todos
          <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {popularSearches.map((search) => (
          <Link
            key={search.label}
            className="group grid min-h-24 grid-cols-[48px_1fr] items-center gap-3 rounded-ca-control border border-ca-border bg-ca-background p-3.5 transition hover:-translate-y-0.5 hover:border-ca-border-hover hover:bg-white"
            href={search.href}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-ca-control bg-white text-ca-navy-900 transition group-hover:bg-ca-navy-900 group-hover:text-white">
              <search.icon className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 block text-sm font-black leading-5 text-ca-blue-700">{search.label}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-ca-text-secondary">
                {search.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
