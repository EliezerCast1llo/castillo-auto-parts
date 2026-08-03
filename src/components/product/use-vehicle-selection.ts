"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { vehicleMakeModelKey } from "@/data/catalog-filters";

export type VehicleSelectionOptions = Pick<
  CatalogFilterOptions,
  | "vehicleMakes"
  | "vehicleModels"
  | "vehicleModelsByMake"
  | "vehicleYears"
  | "vehicleYearsByMake"
  | "vehicleYearsByMakeModel"
>;

type UseVehicleSelectionArgs = {
  options: VehicleSelectionOptions;
  initialMake?: string;
  initialModel?: string;
  initialYear?: string;
};

/**
 * Estado de selects dependientes Marca → Modelo → Año, sin recarga de página.
 *
 * Al cambiar marca se resetean modelo y año; al cambiar modelo se resetea el
 * año solo si queda fuera del rango compatible. Los resets se aplican también
 * de forma imperativa sobre los selects hermanos del mismo <form> para que un
 * submit disparado en el mismo evento (auto-submit del formulario de catálogo)
 * no lea valores obsoletos del DOM.
 */
export function useVehicleSelection({
  options,
  initialMake = "",
  initialModel = "",
  initialYear = "",
}: UseVehicleSelectionArgs) {
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [year, setYear] = useState(initialYear);

  const models = make ? options.vehicleModelsByMake[make] ?? [] : options.vehicleModels;
  const years = yearsFor(options, make, model);

  function resetSibling(event: ChangeEvent<HTMLSelectElement>, name: string) {
    const field = event.target.form?.elements.namedItem(name);
    if (field instanceof HTMLSelectElement) field.value = "";
  }

  function handleMakeChange(event: ChangeEvent<HTMLSelectElement>) {
    setMake(event.target.value);
    setModel("");
    setYear("");
    resetSibling(event, "vehicleModel");
    resetSibling(event, "vehicleYear");
  }

  function handleModelChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextModel = event.target.value;
    setModel(nextModel);

    if (year && !yearsFor(options, make, nextModel).includes(year)) {
      setYear("");
      resetSibling(event, "vehicleYear");
    }
  }

  function handleYearChange(event: ChangeEvent<HTMLSelectElement>) {
    setYear(event.target.value);
  }

  return {
    make,
    model,
    year,
    models,
    years,
    handleMakeChange,
    handleModelChange,
    handleYearChange,
  };
}

function yearsFor(options: VehicleSelectionOptions, make: string, model: string): string[] {
  if (make && model) {
    return options.vehicleYearsByMakeModel[vehicleMakeModelKey(make, model)] ?? [];
  }
  if (make) {
    return options.vehicleYearsByMake[make] ?? [];
  }
  return options.vehicleYears;
}
