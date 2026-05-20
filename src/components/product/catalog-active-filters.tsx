import Link from "next/link";
import { X } from "lucide-react";
import type { CatalogFilters } from "@/data/catalog-filters";

type FilterChip = {
  href: string;
  label: string;
};

export function CatalogActiveFilters({ filters }: { filters: CatalogFilters }) {
  const chips = getActiveFilterChips(filters);

  if (chips.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Filtros activos</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Quita un filtro específico o limpia todo para ampliar resultados.
          </p>
        </div>
        <Link
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-semibold text-primary"
          href="/catalog"
        >
          Limpiar todo
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={`${chip.label}-${chip.href}`}
            aria-label={`Quitar filtro ${chip.label}`}
            className="inline-flex min-h-9 items-center gap-2 rounded-md bg-primary/10 px-3 text-sm font-semibold text-primary"
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

function getActiveFilterChips(filters: CatalogFilters): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.query) {
    chips.push({
      label: `Búsqueda: ${filters.query}`,
      href: buildCatalogHref(filters, { query: "" }),
    });
  }

  if (filters.vehicleMake) {
    chips.push({
      label: `Marca vehículo: ${filters.vehicleMake}`,
      href: buildCatalogHref(filters, {
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: "",
      }),
    });
  }

  if (filters.vehicleModel) {
    chips.push({
      label: `Modelo: ${filters.vehicleModel}`,
      href: buildCatalogHref(filters, { vehicleModel: "", vehicleYear: "" }),
    });
  }

  if (filters.vehicleYear) {
    chips.push({
      label: `Año: ${filters.vehicleYear}`,
      href: buildCatalogHref(filters, { vehicleYear: "" }),
    });
  }

  filters.categories.forEach((category) => {
    chips.push({
      label: `Categoría: ${category}`,
      href: buildCatalogHref(filters, {
        categories: filters.categories.filter((item) => item !== category),
      }),
    });
  });

  filters.brands.forEach((brand) => {
    chips.push({
      label: `Marca producto: ${brand}`,
      href: buildCatalogHref(filters, {
        brands: filters.brands.filter((item) => item !== brand),
      }),
    });
  });

  filters.stockStatuses.forEach((status) => {
    chips.push({
      label: `Disponibilidad: ${status}`,
      href: buildCatalogHref(filters, {
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

function buildCatalogHref(filters: CatalogFilters, patch: FilterPatch) {
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

  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

function appendParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.append(key, value);
  }
}
