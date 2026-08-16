"use client";

import { useRouter } from "next/navigation";
import { Car, Search } from "lucide-react";
import type { ReactNode } from "react";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { useVehicleSelection } from "@/components/product/use-vehicle-selection";
import { buildMyVehicleSetCookie } from "@/lib/my-vehicle";

export function VehicleSelector({ filterOptions }: { filterOptions: CatalogFilterOptions }) {
  const router = useRouter();
  const selection = useVehicleSelection({ options: filterOptions });

  // Los tres pasos son obligatorios: la búsqueda solo tiene sentido con el
  // vehículo completo, y así el botón indica cuándo falta algo.
  const isComplete = Boolean(selection.make && selection.model && selection.year);

  return (
    <div className="ca-container relative z-30 mt-5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:translate-y-1/2">
      <form
        action="/catalog"
        className="grid items-end gap-4 rounded-ca-surface border border-ca-border bg-white p-4 text-ca-text-primary lg:grid-cols-[244px_repeat(3,minmax(0,1fr))_260px] xl:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          // El botón ya va deshabilitado, pero un Enter en un select también
          // envía el formulario: se comprueba aquí para no navegar a medias.
          if (!isComplete) return;

          const params = new URLSearchParams();
          if (selection.make) params.set("vehicleMake", selection.make);
          if (selection.model) params.set("vehicleModel", selection.model);
          if (selection.year) params.set("vehicleYear", selection.year);

          if (selection.make) {
            document.cookie = buildMyVehicleSetCookie({
              make: selection.make,
              model: selection.model || undefined,
              year: selection.year || undefined,
            });
          }

          const query = params.toString();
          router.push(query ? `/catalog?${query}` : "/catalog");
        }}
      >
        <div className="flex items-center gap-4 self-stretch border-ca-border lg:border-r lg:pr-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ca-navy-950 text-white">
            <Car className="h-7 w-7" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[0.95rem] font-extrabold leading-5 text-ca-navy-950">
              Encuentra repuestos para tu vehículo
            </p>
            <p className="mt-1 text-xs leading-5 text-ca-text-secondary">
              Filtra por compatibilidad exacta.
            </p>
          </div>
        </div>

        <VehicleSelectField
          index="1"
          label="Marca"
          name="vehicleMake"
          onChange={selection.handleMakeChange}
          placeholder="Selecciona marca"
          value={selection.make}
        >
          {filterOptions.vehicleMakes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </VehicleSelectField>
        <VehicleSelectField
          disabled={!selection.make}
          index="2"
          label="Modelo"
          name="vehicleModel"
          onChange={selection.handleModelChange}
          placeholder={selection.make ? "Selecciona modelo" : "Elige la marca primero"}
          value={selection.model}
        >
          {selection.models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </VehicleSelectField>
        <VehicleSelectField
          disabled={!selection.model}
          index="3"
          label="Año"
          name="vehicleYear"
          onChange={selection.handleYearChange}
          placeholder={selection.model ? "Selecciona año" : "Elige el modelo primero"}
          value={selection.year}
        >
          {selection.years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </VehicleSelectField>

        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2.5 self-end whitespace-nowrap rounded-ca-control bg-gradient-to-r from-ca-gold-500 to-ca-gold-400 px-6 font-display text-sm font-extrabold tracking-[0.04em] text-ca-navy-950 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:bg-none disabled:bg-ca-disabled-bg disabled:text-ca-disabled-text"
          disabled={!isComplete}
          type="submit"
        >
          <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span>Buscar repuestos</span>
        </button>
      </form>
    </div>
  );
}

function VehicleSelectField({
  children,
  disabled = false,
  index,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  children: ReactNode;
  disabled?: boolean;
  index: string;
  label: string;
  name: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-bold text-ca-navy-950">
      <span className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
            disabled ? "bg-ca-disabled-bg text-ca-disabled-text" : "bg-ca-navy-950 text-white"
          }`}
        >
          {index}
        </span>
        {label}
      </span>
      <select
        className="h-12 w-full rounded-ca-control border border-ca-border bg-white px-3 text-sm font-semibold text-ca-text-secondary outline-none transition focus:border-ca-blue-700 focus:ring-2 focus:ring-ca-blue-700/15 disabled:cursor-not-allowed disabled:bg-ca-disabled-bg disabled:text-ca-disabled-text"
        disabled={disabled}
        name={name}
        onChange={onChange}
        value={value}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </label>
  );
}
