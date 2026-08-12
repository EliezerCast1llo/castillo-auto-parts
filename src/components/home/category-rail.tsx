import Link from "next/link";
import { ArrowRight, BatteryCharging, Disc3, Filter, Gauge, PlugZap, Settings } from "lucide-react";

const categories = [
  {
    icon: Gauge,
    label: "Amortiguadores",
    href: "/catalog?q=amortiguadores",
    color: "text-ca-blue-700 bg-ca-blue-700/[0.08]",
    hoverColor: "group-hover:bg-ca-navy-900 group-hover:text-white",
  },
  {
    icon: Disc3,
    label: "Frenos",
    href: "/catalog?category=Frenos",
    color: "text-danger bg-danger/[0.08]",
    hoverColor: "group-hover:bg-danger group-hover:text-white",
  },
  {
    icon: Filter,
    label: "Filtros",
    href: "/catalog?category=Filtros",
    color: "text-ca-gold-500 bg-ca-gold-400/[0.1]",
    hoverColor: "group-hover:bg-ca-gold-500 group-hover:text-ca-navy-950",
  },
  {
    icon: BatteryCharging,
    label: "Baterías",
    href: "/catalog?q=batería",
    color: "text-success bg-success/[0.08]",
    hoverColor: "group-hover:bg-success group-hover:text-white",
  },
  {
    icon: PlugZap,
    label: "Eléctrico",
    href: "/catalog?q=eléctrico",
    color: "text-ca-blue-600 bg-ca-blue-600/[0.08]",
    hoverColor: "group-hover:bg-ca-blue-700 group-hover:text-white",
  },
  {
    icon: Settings,
    label: "Mantenimiento",
    href: "/catalog?q=mantenimiento",
    color: "text-ca-navy-800 bg-ca-navy-950/[0.07]",
    hoverColor: "group-hover:bg-ca-navy-900 group-hover:text-white",
  },
];

export function CategoryQuickLinks() {
  return (
    <section className="animate-fade-up delay-150 rounded-ca-surface border border-ca-border bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 rounded-full bg-ca-navy-950" />
          <h2
            className="font-display text-xl font-extrabold tracking-[0.02em] text-ca-navy-950"
          >
            Explorar catálogo
          </h2>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ca-blue-700 transition hover:text-ca-navy-950"
          href="/catalog"
        >
          Ver todo
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category) => (
          <Link
            className="group flex min-h-[90px] flex-col items-center justify-center gap-2.5 rounded-ca-control border border-ca-border bg-ca-background p-3 text-center transition hover:-translate-y-0.5 hover:border-ca-border-hover hover:bg-white"
            href={category.href}
            key={category.label}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-ca-control transition ${category.color} ${category.hoverColor}`}>
              <category.icon className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <span className="text-xs font-black leading-4 text-ca-navy-950 sm:text-[13px]">
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
