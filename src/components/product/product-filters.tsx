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
    <section className="rounded-2xl border border-ca-border bg-white p-4 shadow-[var(--ca-shadow-soft)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-ca-navy-950/7 p-2 text-ca-navy-950">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <h2 className="text-base font-black text-ca-navy-950">Filtros</h2>
        </div>
        {activeFilterCount > 0 ? (
          <span className="rounded-full bg-ca-gold-400 px-2.5 py-1 text-xs font-black text-ca-navy-950">
            {activeFilterCount}
          </span>
        ) : null}
      </div>

      <label className="block text-sm font-black text-ca-navy-950">
        Buscar
        <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-ca-border bg-ca-background px-3 transition focus-within:border-ca-blue-700 focus-within:bg-white">
          <Search className="h-4 w-4 text-ca-text-secondary" />
          <input
            className="w-full bg-transparent text-sm font-semibold text-ca-navy-950 outline-none placeholder:text-ca-text-secondary"
            defaultValue={filters.query}
            name="q"
            placeholder="Nombre, SKU o parte"
            type="search"
          />
        </div>
      </label>

      <fieldset className="mt-5 space-y-2">
        <legend className="mb-2 text-sm font-black text-ca-navy-950">Categoría</legend>
        {options.categories.map((category) => (
          <label key={category} className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-ca-text-secondary transition hover:bg-ca-background hover:text-ca-navy-950">
            <input
              className="h-4 w-4 accent-ca-navy-950"
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
        <legend className="mb-2 text-sm font-black text-ca-navy-950">Marca</legend>
        {options.brands.map((brand) => (
          <label key={brand} className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-ca-text-secondary transition hover:bg-ca-background hover:text-ca-navy-950">
            <input
              className="h-4 w-4 accent-ca-navy-950"
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
        <legend className="mb-2 text-sm font-black text-ca-navy-950">Disponibilidad</legend>
        {options.stockStatuses.map((status) => (
          <label key={status} className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-ca-text-secondary transition hover:bg-ca-background hover:text-ca-navy-950">
            <input
              className="h-4 w-4 accent-ca-navy-950"
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
        <button className="inline-flex h-11 items-center justify-center rounded-xl bg-ca-navy-950 px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(6,25,51,0.16)] transition hover:bg-ca-navy-800">
          Buscar
        </button>
        {activeFilterCount > 0 ? (
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl border border-ca-border bg-white px-4 text-sm font-black text-ca-navy-950 transition hover:bg-ca-background"
            href="/catalog"
          >
            Limpiar filtros
          </Link>
        ) : null}
      </div>
    </section>
  );
}
