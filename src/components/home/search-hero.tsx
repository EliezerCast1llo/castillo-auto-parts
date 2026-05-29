import Image from "next/image";
import Link from "next/link";
import { Car, CheckCircle2, MapPin, PackageSearch, Search, ShieldCheck, Truck } from "lucide-react";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { ProductVisual } from "@/components/product/product-visual";

const heroSignals = [
  {
    icon: ShieldCheck,
    label: "Compatibilidad verificada",
  },
  {
    icon: PackageSearch,
    label: "Stock visible en tiempo real",
  },
  {
    icon: MapPin,
    label: "Entrega local en El Salvador",
  },
];

const floatingParts = [
  { brand: "BOSCH", label: "Filtros de aceite", seed: "bosch-filter" },
  { brand: "NGK", label: "Bujías", seed: "ngk-spark" },
  { brand: "WIX", label: "Filtros de aire", seed: "wix-air" },
];

export function SearchHero({ filterOptions }: { filterOptions: CatalogFilterOptions }) {
  return (
    <section className="relative bg-ca-navy-950 pb-8 text-white lg:pb-[5.5rem]">
      <div className="ca-container">
        <SearchAutocomplete variant="hero" />

        <div className="relative mt-0 overflow-hidden rounded-b-[28px] bg-ca-navy-900 shadow-[var(--ca-shadow-hero)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(18,103,197,0.26),transparent_27rem)]" />
          <div className="grid min-h-[390px] lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative z-10 flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-10 xl:px-11">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-ca-gold-400">
                Castillo Auto Parts
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.05] tracking-normal sm:text-5xl xl:text-[56px]">
                Encuentra repuestos{" "}
                <span className="block text-ca-gold-400">compatibles con tu vehículo</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
                Catálogo automotriz para El Salvador con stock visible, compatibilidad clara y compra
                rápida como invitado.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:max-w-2xl">
                {heroSignals.map((signal) => (
                  <div className="flex items-center gap-3" key={signal.label}>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] text-ca-gold-400">
                      <signal.icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <span className="text-sm font-bold leading-5 text-white/92">{signal.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
              <div className="absolute inset-y-0 left-0 z-10 hidden w-44 bg-gradient-to-r from-ca-navy-900 via-ca-navy-900/75 to-transparent lg:block" />
              <Image
                alt="Vehículo sedán moderno para búsqueda de repuestos compatibles"
                className="object-cover object-[62%_center] opacity-[0.9]"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=82"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ca-navy-950/38 via-ca-navy-950/18 to-ca-navy-950/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-ca-navy-950/52 via-transparent to-ca-navy-950/12" />
              <FloatingPartCard className="left-[8%] top-8" part={floatingParts[0]} />
              <FloatingPartCard className="right-6 top-12 hidden sm:block" part={floatingParts[1]} />
              <FloatingPartCard className="bottom-8 right-[10%] hidden md:block" part={floatingParts[2]} />
            </div>
          </div>
        </div>
      </div>

      <VehicleSelector filterOptions={filterOptions} />
    </section>
  );
}


export function VehicleSelector({ filterOptions }: { filterOptions: CatalogFilterOptions }) {
  const makes = filterOptions.vehicleMakes;
  const models = filterOptions.vehicleModels;
  const years = filterOptions.vehicleYears;

  return (
    <div className="ca-container relative z-30 mt-5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:translate-y-1/2">
      <form
        action="/catalog"
        className="grid items-end gap-4 rounded-[22px] border border-ca-border bg-white p-4 text-ca-text-primary shadow-[var(--ca-shadow-premium)] lg:grid-cols-[244px_repeat(4,minmax(0,1fr))_260px] xl:p-5"
      >
        <div className="flex items-center gap-4 self-stretch border-ca-border lg:border-r lg:pr-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ca-navy-950 text-white">
            <Car className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-base font-black leading-5 text-ca-navy-950">Encuentra repuestos para tu vehículo</p>
            <p className="mt-1 text-sm leading-5 text-ca-text-secondary">Selecciona datos para ver solo lo compatible.</p>
          </div>
        </div>

        <VehicleSelect index="1" label="Marca" name="vehicleMake" options={makes} placeholder="Selecciona marca" />
        <VehicleSelect index="2" label="Modelo" name="vehicleModel" options={models} placeholder="Selecciona modelo" />
        <VehicleSelect index="3" label="Año" name="vehicleYear" options={years} placeholder="Selecciona año" />
        <VehicleSelect
          index="4"
          label="Motor"
          name="q"
          options={["1.8L", "1.6L", "2.0L", "Diésel", "Gasolina"]}
          placeholder="Selecciona motor"
        />

        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2.5 self-end whitespace-nowrap rounded-[14px] border border-[#C98F12]/30 bg-gradient-to-r from-ca-gold-500 to-ca-gold-400 px-6 text-sm font-black leading-none text-ca-navy-950 shadow-[0_12px_24px_rgba(217,162,27,0.22)] transition duration-200 hover:-translate-y-0.5 hover:from-ca-gold-400 hover:to-[#F2B72A] hover:shadow-[0_16px_30px_rgba(217,162,27,0.28)] active:translate-y-0"
          type="submit"
        >
          <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span>Buscar compatibilidad</span>
        </button>
      </form>
    </div>
  );
}

function VehicleSelect({
  index,
  label,
  name,
  options,
  placeholder,
}: {
  index: string;
  label: string;
  name: string;
  options: string[];
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-black text-ca-navy-950">
      <span className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ca-navy-950/[0.08] text-xs font-black">
          {index}
        </span>
        {label}
      </span>
      <select
        className="h-12 w-full rounded-[12px] border border-ca-border bg-white px-3 text-sm font-semibold text-ca-text-secondary outline-none transition focus:border-ca-blue-700"
        name={name}
        defaultValue=""
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FloatingPartCard({
  className,
  part,
}: {
  className: string;
  part: {
    brand: string;
    label: string;
    seed: string;
  };
}) {
  return (
    <div
      className={`absolute z-20 flex min-w-36 items-center gap-2.5 rounded-2xl border border-white/45 bg-white/88 p-2.5 text-ca-navy-950 shadow-[0_16px_34px_rgba(6,25,51,0.16)] backdrop-blur ${className}`}
    >
      <div>
        <p className="text-sm font-black text-danger">{part.brand}</p>
        <p className="mt-1 text-xs font-bold">{part.label}</p>
      </div>
      <ProductVisual kind={part.label} seed={part.seed} size="thumb" />
    </div>
  );
}

export function HeroSupportLink() {
  return (
    <Link className="inline-flex items-center gap-2 text-sm font-bold text-ca-navy-900" href="/catalog">
      <Truck className="h-4 w-4" />
      Ver zonas de entrega
      <CheckCircle2 className="h-4 w-4 text-success" />
    </Link>
  );
}
