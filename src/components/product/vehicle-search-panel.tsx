"use client";

import { Car } from "lucide-react";
import type { CatalogFilterOptions, CatalogFilters } from "@/data/catalog-filters";
import { useVehicleSelection } from "@/components/product/use-vehicle-selection";
import { Select } from "@/components/ui/select";

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
        <Select
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
