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
    <section className="rounded-md border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Car className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Busca por vehículo</h2>
      </div>
      <div className="space-y-3">
        <select
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
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
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
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
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
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
