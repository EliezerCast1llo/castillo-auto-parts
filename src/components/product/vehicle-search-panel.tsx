"use client";

import { Car } from "lucide-react";
import type { CatalogFilterOptions, CatalogFilters } from "@/data/catalog-filters";
import { useVehicleSelection } from "@/components/product/use-vehicle-selection";
import { Select } from "@/components/ui/select";

/** Aplana la primitiva Select a la escala del catálogo (radio y peso menores). */
const FLAT_SELECT = "h-10 rounded-ca-control bg-white font-normal";

type VehicleSearchPanelProps = {
  filters: CatalogFilters;
  options: CatalogFilterOptions;
};

export function VehicleSearchPanel({ filters, options }: VehicleSearchPanelProps) {
  const selection = useVehicleSelection({
    options,
    initialMake: filters.vehicleMake,
    initialModel: filters.vehicleModel,
    initialYear: filters.vehicleYear,
  });

  return (
    <section>
      <h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-ca-navy-950">
        <Car aria-hidden className="h-4 w-4 shrink-0 text-ca-text-secondary" />
        Busca por vehículo
      </h2>
      <div className="mt-2 space-y-2">
        <Select
          className={FLAT_SELECT}
          aria-label="Marca de vehículo"
          name="vehicleMake"
          onChange={selection.handleMakeChange}
          value={selection.make}
        >
          <option value="">Marca</option>
          {options.vehicleMakes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </Select>
        <Select
          className={FLAT_SELECT}
          aria-label="Modelo de vehículo"
          name="vehicleModel"
          onChange={selection.handleModelChange}
          value={selection.model}
        >
          <option value="">Modelo</option>
          {selection.models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </Select>
        <Select
          className={FLAT_SELECT}
          aria-label="Año de vehículo"
          name="vehicleYear"
          onChange={selection.handleYearChange}
          value={selection.year}
        >
          <option value="">Año</option>
          {selection.years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </div>
    </section>
  );
}
