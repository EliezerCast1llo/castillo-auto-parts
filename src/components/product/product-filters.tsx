import Link from "next/link";
import { Search } from "lucide-react";
import type { CatalogFilterOptions, CatalogFilters } from "@/data/catalog-filters";

type ProductFiltersProps = {
  activeFilterCount: number;
  filters: CatalogFilters;
  options: CatalogFilterOptions;
};

/**
 * Facetas del catálogo. Sin tarjeta ni sombra propias: la superficie la pone
 * el contenedor (aside en desktop, drawer en móvil) y aquí solo hay listas
 * separadas por reglas, que es lo que hace legible una columna de filtros.
 */
export function ProductFilters({ activeFilterCount, filters, options }: ProductFiltersProps) {
  return (
    <section className="border-t border-ca-border pt-4">
      <label className="block">
        <FilterHeading>Buscar</FilterHeading>
        <div className="mt-2 flex h-10 items-center gap-2 rounded-ca-control border border-ca-border bg-white px-2.5 transition focus-within:border-ca-blue-700">
          <Search className="h-4 w-4 shrink-0 text-ca-text-secondary" />
          <input
            className="w-full bg-transparent text-sm text-ca-navy-950 outline-none placeholder:text-ca-text-secondary"
            defaultValue={filters.query}
            name="q"
            placeholder="Nombre, SKU o parte"
            type="search"
          />
        </div>
      </label>

      <FilterGroup legend="Categoría">
        {options.categories.map((category) => (
          <FilterOption
            key={category}
            count={options.categoryCounts[category]}
            defaultChecked={filters.categories.includes(category)}
            label={category}
            name="category"
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Marca">
        {options.brands.map((brand) => (
          <FilterOption
            key={brand}
            count={options.brandCounts[brand]}
            defaultChecked={filters.brands.includes(brand)}
            label={brand}
            name="brand"
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Disponibilidad">
        {options.stockStatuses.map((status) => (
          <FilterOption
            key={status}
            defaultChecked={filters.stockStatuses.includes(status)}
            label={status}
            name="stock"
          />
        ))}
      </FilterGroup>

      <div className="mt-4 grid gap-2 border-t border-ca-border pt-4">
        {/* Los filtros se aplican al cambiar; el botón es el camino sin JS. */}
        <button className="inline-flex h-10 items-center justify-center rounded-ca-control border border-ca-navy-950 bg-white px-4 text-sm font-bold text-ca-navy-950 transition hover:bg-ca-navy-950 hover:text-white">
          Buscar
        </button>
        {activeFilterCount > 0 ? (
          <Link
            className="inline-flex h-10 items-center justify-center rounded-ca-control px-4 text-sm font-bold text-ca-text-secondary underline-offset-2 transition hover:text-ca-navy-950 hover:underline"
            href="/catalog"
          >
            Limpiar filtros ({activeFilterCount})
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function FilterHeading({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.1em] text-ca-navy-950">
      {children}
    </span>
  );
}

function FilterGroup({ children, legend }: { children: React.ReactNode; legend: string }) {
  return (
    <fieldset className="mt-4 border-t border-ca-border pt-4">
      <legend className="sr-only">{legend}</legend>
      <FilterHeading>{legend}</FilterHeading>
      <div className="mt-1.5">{children}</div>
    </fieldset>
  );
}

function FilterOption({
  count,
  defaultChecked,
  label,
  name,
}: {
  count?: number;
  defaultChecked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center gap-2 text-sm text-ca-text-primary transition hover:text-ca-blue-700">
      <input
        className="h-4 w-4 shrink-0 accent-ca-navy-950"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        value={label}
      />
      <span className="flex-1">{label}</span>
      {typeof count === "number" ? (
        <span className="shrink-0 text-xs text-ca-text-secondary">({count})</span>
      ) : null}
    </label>
  );
}
