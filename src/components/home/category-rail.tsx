import Link from "next/link";
import { ArrowRight, BatteryCharging, Disc3, Filter, Gauge, PlugZap, Settings } from "lucide-react";

const categories = [
  {
    icon: Gauge,
    label: "Amortiguadores",
    href: "/catalog?q=amortiguadores",
  },
  {
    icon: Disc3,
    label: "Frenos",
    href: "/catalog?category=Frenos",
  },
  {
    icon: Filter,
    label: "Filtros",
    href: "/catalog?category=Filtros",
  },
  {
    icon: BatteryCharging,
    label: "Baterías",
    href: "/catalog?q=batería",
  },
  {
    icon: PlugZap,
    label: "Eléctrico",
    href: "/catalog?q=eléctrico",
  },
  {
    icon: Settings,
    label: "Mantenimiento",
    href: "/catalog?q=mantenimiento",
  },
];

export function CategoryQuickLinks() {
  return (
    <section className="rounded-2xl border border-ca-border bg-white p-5 shadow-[var(--ca-shadow-soft)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-ca-navy-950">Entradas rápidas al catálogo</h2>
        <Link className="inline-flex shrink-0 items-center gap-2 text-sm font-black text-ca-blue-700" href="/catalog">
          Ver todo el catálogo
          <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category) => (
          <Link
            className="group flex min-h-24 flex-col items-center justify-center gap-3 rounded-[14px] border border-ca-border bg-ca-background p-3 text-center text-ca-navy-900 transition hover:-translate-y-0.5 hover:border-[#c3cfdd] hover:bg-white"
            href={category.href}
            key={category.label}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-ca-blue-700 shadow-[0_6px_18px_rgba(6,25,51,0.05)] transition group-hover:bg-ca-navy-900 group-hover:text-white">
              <category.icon className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <span className="line-clamp-2 max-w-full text-xs font-black leading-4 sm:text-[13px]">
              {category.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CategoryRail() {
  return <CategoryQuickLinks />;
}
