import Link from "next/link";
import { X } from "lucide-react";
import type { CatalogFilters, CatalogSort } from "@/data/catalog-filters";

type FilterChip = {
  href: string;
  label: string;
};

export function CatalogActiveFilters({
  filters,
  sort = "relevance",
}: {
  filters: CatalogFilters;
  sort?: CatalogSort;
}) {
  const chips = getActiveFilterChips(filters, sort);

  if (chips.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-ca-border bg-white p-4 shadow-[var(--ca-shadow-soft)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-ca-navy-950">Filtros activos</p>
          <p className="mt-1 text-xs font-medium text-ca-text-secondary">
            Quita un filtro específico o limpia todo para ampliar resultados.
          </p>
        </div>
        <Link
          className="inline-flex h-9 items-center justify-center rounded-xl border border-ca-border bg-white px-3 text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white"
          href={sort === "relevance" ? "/catalog" : `/catalog?sort=${sort}`}
        >
          Limpiar todo
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={`${chip.label}-${chip.href}`}
            aria-label={`Quitar filtro ${chip.label}`}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-ca-navy-950/10 bg-ca-navy-950/5 px-3 text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950/25 hover:bg-ca-background"
            href={chip.href}
          >
            {chip.label}
            <X className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function getActiveFilterChips(filters: CatalogFilters, sort: CatalogSort): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.query) {
    chips.push({
      label: `Búsqueda: ${filters.query}`,
      href: buildCatalogHref(filters, sort, { query: "" }),
    });
  }

  if (filters.vehicleMake) {
    chips.push({
      label: `Marca vehículo: ${filters.vehicleMake}`,
      href: buildCatalogHref(filters, sort, {
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: "",
      }),
    });
  }

  if (filters.vehicleModel) {
    chips.push({
      label: `Modelo: ${filters.vehicleModel}`,
      href: buildCatalogHref(filters, sort, { vehicleModel: "", vehicleYear: "" }),
    });
  }

  if (filters.vehicleYear) {
    chips.push({
      label: `Año: ${filters.vehicleYear}`,
      href: buildCatalogHref(filters, sort, { vehicleYear: "" }),
    });
  }

  filters.categories.forEach((category) => {
    chips.push({
      label: `Categoría: ${category}`,
      href: buildCatalogHref(filters, sort, {
        categories: filters.categories.filter((item) => item !== category),
      }),
    });
  });

  filters.brands.forEach((brand) => {
    chips.push({
      label: `Marca producto: ${brand}`,
      href: buildCatalogHref(filters, sort, {
        brands: filters.brands.filter((item) => item !== brand),
      }),
    });
  });

  filters.stockStatuses.forEach((status) => {
    chips.push({
      label: `Disponibilidad: ${status}`,
      href: buildCatalogHref(filters, sort, {
        stockStatuses: filters.stockStatuses.filter((item) => item !== status),
      }),
    });
  });

  return chips;
}

type FilterPatch = Partial<
  Pick<
    CatalogFilters,
    "query" | "categories" | "brands" | "stockStatuses" | "vehicleMake" | "vehicleModel" | "vehicleYear"
  >
>;

function buildCatalogHref(filters: CatalogFilters, sort: CatalogSort, patch: FilterPatch) {
  const next: CatalogFilters = {
    ...filters,
    categories: [...filters.categories],
    brands: [...filters.brands],
    stockStatuses: [...filters.stockStatuses],
    ...patch,
  };
  const params = new URLSearchParams();

  appendParam(params, "q", next.query);
  next.categories.forEach((category) => appendParam(params, "category", category));
  next.brands.forEach((brand) => appendParam(params, "brand", brand));
  next.stockStatuses.forEach((status) => appendParam(params, "stock", status));
  appendParam(params, "vehicleMake", next.vehicleMake);
  appendParam(params, "vehicleModel", next.vehicleModel);
  appendParam(params, "vehicleYear", next.vehicleYear);
  if (sort !== "relevance") appendParam(params, "sort", sort);

  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

function appendParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.append(key, value);
  }
}
