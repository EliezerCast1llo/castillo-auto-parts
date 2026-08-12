import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { vehicleMakeSlug } from "@/data/vehicle-catalog";

type BrandStripProps = {
  /** Marcas de vehículo del catálogo; enlazan a /vehiculos/[make]. */
  vehicleMakes?: string[];
  /** Fabricantes de repuesto; enlazan al filtro de marca del catálogo. */
  partBrands?: string[];
};

/**
 * Dos cosas distintas, dos bloques distintos.
 *
 * Antes un único bloque titulado "Repuestos por marca de vehículo" listaba
 * Honda…Toyota y a continuación BOSCH, NGK y WIX, que no son marcas de
 * vehículo sino fabricantes de repuesto, y además estaban escritos a mano.
 * Ahora ambas listas salen de las facetas del catálogo y van separadas,
 * porque llevan a sitios distintos: la del vehículo a su landing, la del
 * fabricante al filtro de marca.
 */
export function BrandStrip({ vehicleMakes = [], partBrands = [] }: BrandStripProps) {
  const makes = vehicleMakes.slice(0, 10);
  const brands = partBrands.slice(0, 10);

  return (
    <div className="space-y-6">
      {makes.length > 0 ? (
        <BrandGroup
          cta={{ href: "/catalog", label: "Ver catálogo" }}
          title="Repuestos por marca de vehículo"
        >
          {makes.map((make) => (
            <BrandTile
              href={`/vehiculos/${vehicleMakeSlug(make)}`}
              key={make}
              label={make}
            />
          ))}
        </BrandGroup>
      ) : null}

      {brands.length > 0 ? (
        <BrandGroup title="Marcas de repuesto">
          {brands.map((brand) => (
            <BrandTile
              href={`/catalog?brand=${encodeURIComponent(brand)}`}
              key={brand}
              label={brand}
            />
          ))}
        </BrandGroup>
      ) : null}
    </div>
  );
}

function BrandGroup({
  children,
  cta,
  title,
}: {
  children: React.ReactNode;
  cta?: { href: string; label: string };
  title: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 bg-ca-gold-400" />
          <h2 className="font-display text-xl font-extrabold tracking-[0.02em] text-ca-navy-950">
            {title}
          </h2>
        </div>
        {cta ? (
          <Link
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ca-blue-700 transition hover:text-ca-navy-950"
            href={cta.href}
          >
            {cta.label}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
        {children}
      </div>
    </section>
  );
}

/**
 * Casilla compacta en la tipografía de cuerpo. Antes iba en display
 * condensada a 11px, en versales y con mucho tracking: a ese tamaño la
 * condensada se lee peor y el recuadro quedaba desproporcionado para el
 * texto que contiene.
 */
function BrandTile({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="flex h-10 items-center justify-center rounded-ca-control border border-ca-border bg-white px-3 text-center text-sm font-semibold text-ca-navy-950 transition-colors hover:border-ca-navy-950/30 hover:text-ca-blue-700"
      href={href}
    >
      {label}
    </Link>
  );
}
