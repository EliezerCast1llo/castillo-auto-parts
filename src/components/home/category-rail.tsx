import Link from "next/link";
import { BatteryCharging, Disc3, Droplets, Gauge, PlugZap, Wrench } from "lucide-react";

const categories = [
  {
    icon: <Gauge className="h-5 w-5" />,
    label: "Amortiguadores",
    href: "/catalog?q=amortiguadores",
  },
  {
    icon: <Disc3 className="h-5 w-5" />,
    label: "Frenos",
    href: "/catalog?category=Frenos",
  },
  {
    icon: <Droplets className="h-5 w-5" />,
    label: "Filtros",
    href: "/catalog?category=Filtros",
  },
  {
    icon: <BatteryCharging className="h-5 w-5" />,
    label: "Baterías",
    href: "/catalog?q=batería",
  },
  {
    icon: <PlugZap className="h-5 w-5" />,
    label: "Eléctrico",
    href: "/catalog?q=eléctrico",
  },
  {
    icon: <Wrench className="h-5 w-5" />,
    label: "Mantenimiento",
    href: "/catalog?q=mantenimiento",
  },
];

export function CategoryRail() {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-success">Categorías</p>
          <h2 className="text-lg font-bold text-primary">Entradas rápidas al catálogo</h2>
        </div>
        <Link className="text-sm font-semibold text-primary" href="/catalog">
          Ver todas
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            className="flex min-h-24 flex-col justify-between rounded-md border border-border bg-background p-3 text-primary transition hover:border-primary hover:bg-primary/5"
            href={category.href}
            key={category.label}
          >
            <span className="text-primary">{category.icon}</span>
            <span className="text-sm font-bold">{category.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
