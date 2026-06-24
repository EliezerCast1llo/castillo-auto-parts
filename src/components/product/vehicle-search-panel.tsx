import { Car } from "lucide-react";
import type { CatalogFilterOptions, CatalogFilters } from "@/data/catalog-filters";

type VehicleSearchPanelProps = {
  filters: CatalogFilters;
  options: CatalogFilterOptions;
};

export function VehicleSearchPanel({ filters, options }: VehicleSearchPanelProps) {
  const vehicleModels = filters.vehicleMake
    ? options.vehicleModelsByMake[filters.vehicleMake] ?? options.vehicleModels
    : options.vehicleModels;

  return (
    <section className="rounded-2xl border border-ca-border bg-white p-4 shadow-[var(--ca-shadow-soft)]">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-xl bg-ca-gold-400/18 p-2 text-ca-navy-950">
          <Car className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-black text-ca-navy-950">Busca por vehículo</h2>
          <p className="text-xs font-medium text-ca-text-secondary">Marca, modelo y año</p>
        </div>
      </div>
      <div className="space-y-3">
        <select
          className="h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm font-bold text-ca-navy-950 outline-none transition focus:border-ca-blue-700 focus:bg-white"
          defaultValue={filters.vehicleMake}
          name="vehicleMake"
        >
          <option value="">Marca</option>
          {options.vehicleMakes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
        <select
          className="h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm font-bold text-ca-navy-950 outline-none transition focus:border-ca-blue-700 focus:bg-white"
          defaultValue={filters.vehicleModel}
          name="vehicleModel"
        >
          <option value="">Modelo</option>
          {vehicleModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        <select
          className="h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm font-bold text-ca-navy-950 outline-none transition focus:border-ca-blue-700 focus:bg-white"
          defaultValue={filters.vehicleYear}
          name="vehicleYear"
        >
          <option value="">Año</option>
          {options.vehicleYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
