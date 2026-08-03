import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { vehicleMakeSlug } from "@/data/vehicle-catalog";

type BrandStripProps = {
  /** Marcas de vehículo reales del catálogo (facets); enlazan a /vehiculos/[make]. */
  vehicleMakes?: string[];
};

/** Marcas de repuesto (fabricantes); enlazan al filtro de marca del catálogo. */
const partBrands = ["BOSCH", "NGK", "WIX"];

export function BrandStrip({ vehicleMakes = [] }: BrandStripProps) {
  const makes = vehicleMakes.slice(0, 7);

  return (
    <section className="animate-fade-up delay-100 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 rounded-full bg-ca-gold-400" />
          <h2
            className="font-display text-xl font-extrabold tracking-[0.02em] text-ca-navy-950"
          >
            Repuestos por marca de vehículo
          </h2>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ca-blue-700 transition hover:text-ca-navy-950"
          href="/catalog"
        >
          Ver todas
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
        {makes.map((make, i) => (
          <BrandTile
            href={`/vehiculos/${vehicleMakeSlug(make)}`}
            index={i}
            key={make}
            label={make.toUpperCase()}
          />
        ))}
        {partBrands.map((brand, i) => (
          <BrandTile
            href={`/catalog?brand=${encodeURIComponent(brand)}`}
            index={makes.length + i}
            key={brand}
            label={brand}
          />
        ))}
      </div>
    </section>
  );
}

function BrandTile({ href, index, label }: { href: string; index: number; label: string }) {
  return (
    <Link
      className="ca-card-lift group flex h-[52px] items-center justify-center rounded-xl border border-ca-border bg-white px-3 text-center shadow-[0_2px_8px_rgba(6,25,51,0.04)]"
      href={href}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <span
        className="font-display text-[11px] font-black tracking-[0.12em] text-ca-navy-900 transition group-hover:text-ca-blue-700"
      >
        {label}
      </span>
    </Link>
  );
}
