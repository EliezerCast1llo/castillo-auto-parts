"use client";

import { useRouter } from "@/lib/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Car, Search } from "lucide-react";
import type { ReactNode } from "react";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { useVehicleSelection } from "@/components/product/use-vehicle-selection";
import { buildMyVehicleSetCookie } from "@/lib/my-vehicle";
import { toLinkQuery } from "@/lib/url-utils";

export function VehicleSelector({ filterOptions }: { filterOptions: CatalogFilterOptions }) {
  const t = useTranslations("VehicleSearch");
  const router = useRouter();
  const selection = useVehicleSelection({ options: filterOptions });

  // Los tres pasos son obligatorios: la búsqueda solo tiene sentido con el
  // vehículo completo, y así el botón indica cuándo falta algo.
  const isComplete = Boolean(selection.make && selection.model && selection.year);

  return (
    <form
      action="/catalog"
      className="grid items-end gap-4 rounded-ca-surface border border-ca-border bg-ca-bg p-4 text-ca-text lg:grid-cols-[minmax(12rem,1.25fr)_repeat(3,minmax(0,1fr))_auto]"
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

        router.push({ pathname: "/catalog", query: toLinkQuery(params) });
      }}
    >
      <div className="flex items-center gap-4 self-stretch border-ca-border lg:border-r lg:pr-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ca-control border border-ca-border bg-ca-surface text-ca-navy">
          <Car className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold leading-5 text-ca-navy">
            {t("title")}
          </p>
          <p className="mt-1 text-xs leading-5 text-ca-text-secondary">
            {t("heroDescription")}
          </p>
        </div>
      </div>

      <VehicleSelectField
        index="1"
        label={t("make")}
        name="vehicleMake"
        onChange={selection.handleMakeChange}
        placeholder={t("selectMake")}
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
        label={t("model")}
        name="vehicleModel"
        onChange={selection.handleModelChange}
        placeholder={selection.make ? t("selectModel") : t("chooseMakeFirst")}
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
        label={t("year")}
        name="vehicleYear"
        onChange={selection.handleYearChange}
        placeholder={selection.model ? t("selectYear") : t("chooseModelFirst")}
        value={selection.year}
      >
        {selection.years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </VehicleSelectField>

      <Button className="w-full whitespace-nowrap" disabled={!isComplete} size="lg" type="submit">
        <Search aria-hidden="true" className="h-4 w-4" />
        {t("searchParts")}
      </Button>
    </form>
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
    <label className="block text-sm font-bold text-ca-navy">
      <span className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-ca-control text-xs font-bold ${
 disabled ? "bg-ca-bg text-ca-text-secondary" : "bg-ca-navy text-white"
 }`}
        >
          {index}
        </span>
        {label}
      </span>
      <select
        className="h-12 w-full rounded-ca-control border border-ca-border bg-ca-surface px-3 text-sm font-semibold text-ca-text-secondary transition focus:border-ca-navy-hover focus:ring-2 focus:ring-ca-navy-hover/15 disabled:cursor-not-allowed disabled:bg-ca-bg disabled:text-ca-text-secondary"
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
