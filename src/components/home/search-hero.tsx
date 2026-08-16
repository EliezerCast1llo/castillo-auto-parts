import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, MapPin, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { VehicleSelector } from "@/components/home/vehicle-selector";

const heroSignals = [
  {
    icon: ShieldCheck,
    label: "Busca por vehículo",
  },
  {
    icon: PackageSearch,
    label: "Disponibilidad visible",
  },
  {
    icon: MapPin,
    label: "Entrega local",
  },
];

export function SearchHero({ filterOptions }: { filterOptions: CatalogFilterOptions }) {
  return (
    <section className="relative ca-noise bg-ca-navy-950 pb-8 text-white lg:pb-[5.5rem]">
      {/* Grid texture + blobs — clipped within this overlay div only */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ca-grid-bg absolute inset-0" />
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-ca-blue-700/20 blur-[80px]" />
        <div className="absolute -bottom-20 left-0 h-[300px] w-[400px] rounded-full bg-ca-gold-500/10 blur-[60px]" />
      </div>

      <div className="ca-container relative">
        {/* Search bar */}
        <div className="animate-fade-up">
          <SearchAutocomplete variant="hero" />
        </div>

        {/* Hero card */}
        <div className="animate-fade-up delay-100 relative mt-0 overflow-hidden rounded-b-[28px] border border-white/[0.07] bg-ca-navy-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(18,103,197,0.26),transparent_27rem)]" />

          <div className="grid min-h-[390px] lg:grid-cols-[0.88fr_1.12fr]">
            {/* Copy */}
            <div className="relative z-10 flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-10 xl:px-11">
              <p className="ca-section-label animate-fade-up delay-200">
                <span className="h-px w-6 bg-ca-gold-400" />
                Castillo Auto Parts
              </p>
              <h1
                className="animate-fade-up delay-300 mt-4 max-w-2xl leading-[1.0] tracking-tight"
                style={{
                  fontFamily: "var(--font-display), ui-sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2.4rem, 5vw, 3.5rem)",
                }}
              >
                Encuentra repuestos{" "}
                <span className="ca-gold-shimmer block">
                  compatibles con tu vehículo
                </span>
              </h1>
              <p className="animate-fade-up delay-400 mt-5 max-w-xl text-base leading-7 text-white/75">
                Busca por vehículo, categoría, marca o número de parte. Si no estás seguro,
                te ayudamos a revisar la compatibilidad antes de comprar.
              </p>

              <div className="animate-fade-up delay-500 mt-8 grid gap-3 sm:grid-cols-3 lg:max-w-2xl">
                {heroSignals.map((signal) => (
                  <div className="flex items-center gap-3" key={signal.label}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control border border-ca-gold-400/20 bg-ca-gold-400/10 text-ca-gold-400">
                      <signal.icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <span className="text-sm font-semibold leading-5 text-white/85">{signal.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
              <div className="absolute inset-y-0 left-0 z-10 hidden w-44 bg-gradient-to-r from-ca-navy-900 via-ca-navy-900/75 to-transparent lg:block" />
              <Image
                alt="Vehículo sedán moderno para búsqueda de repuestos compatibles"
                className="object-cover object-[62%_center] opacity-90"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                src="/hero-vehicle.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ca-navy-950/40 via-ca-navy-950/15 to-ca-navy-950/28" />
              <div className="absolute inset-0 bg-gradient-to-t from-ca-navy-950/55 via-transparent to-ca-navy-950/10" />
            </div>
          </div>
        </div>
      </div>

      <VehicleSelector filterOptions={filterOptions} />
    </section>
  );
}

export function HeroSupportLink() {
  return (
    <Link className="inline-flex items-center gap-2 text-sm font-bold text-ca-navy-900" href="/catalog">
      <Truck className="h-4 w-4" />
      Conoce las opciones de entrega
      <CheckCircle2 className="h-4 w-4 text-success" />
    </Link>
  );
}
