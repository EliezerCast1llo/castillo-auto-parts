import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { CatalogFilterOptions, CatalogFilters } from "@/data/catalog-filters";

type ProductFiltersProps = {
  activeFilterCount: number;
  filters: CatalogFilters;
  options: CatalogFilterOptions;
};

export function ProductFilters({ activeFilterCount, filters, options }: ProductFiltersProps) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Filtros</h2>
      </div>

      <label className="block text-sm font-semibold">
        Buscar
        <div className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            defaultValue={filters.query}
            name="q"
            placeholder="Nombre, SKU o parte"
            type="search"
          />
        </div>
      </label>

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-semibold">Categoría</legend>
        {options.categories.map((category) => (
          <label key={category} className="flex items-center gap-2 text-sm">
            <input
              className="h-4 w-4 accent-primary"
              defaultChecked={filters.categories.includes(category)}
              name="category"
              type="checkbox"
              value={category}
            />
            {category}
          </label>
        ))}
      </fieldset>

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-semibold">Marca</legend>
        {options.brands.map((brand) => (
          <label key={brand} className="flex items-center gap-2 text-sm">
            <input
              className="h-4 w-4 accent-primary"
              defaultChecked={filters.brands.includes(brand)}
              name="brand"
              type="checkbox"
              value={brand}
            />
            {brand}
          </label>
        ))}
      </fieldset>

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-semibold">Disponibilidad</legend>
        {options.stockStatuses.map((status) => (
          <label key={status} className="flex items-center gap-2 text-sm">
            <input
              className="h-4 w-4 accent-primary"
              defaultChecked={filters.stockStatuses.includes(status)}
              name="stock"
              type="checkbox"
              value={status}
            />
            {status}
          </label>
        ))}
      </fieldset>

      <div className="mt-5 grid gap-2">
        <button className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
          Buscar
        </button>
        {activeFilterCount > 0 ? (
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary"
            href="/catalog"
          >
            Limpiar filtros
          </Link>
        ) : null}
      </div>
    </section>
  );
}
