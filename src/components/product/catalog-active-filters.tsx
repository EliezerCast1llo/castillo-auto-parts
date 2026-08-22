import { Link } from "@/lib/i18n/navigation";
import { X } from "lucide-react";
import { categoryLabelOf } from "@/data/catalog-filters";
import type { CatalogFilters, CatalogFilterOptions, CatalogSort } from "@/data/catalog-filters";
import type { LocaleHref } from "@/lib/i18n/navigation";
import { stockStatuses, type StockStatus } from "@/lib/stock-status";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { toLinkQuery } from "@/lib/url-utils";

type FilterChip = {
  href: LocaleHref;
  label: string;
};

export async function CatalogActiveFilters({
  filters,
  locale,
  options,
  sort = "relevance",
  hideVehicleChips = false,
}: {
  filters: CatalogFilters;
  locale: Locale;
  /**
   * Las facetas, solo para resolver el nombre visible de cada categoría: el
   * filtro guarda el slug y el chip tiene que mostrar el texto traducido.
   */
  options: CatalogFilterOptions;
  sort?: CatalogSort;
  /**
   * Cuando el filtro de vehículo viene de la cookie "mi vehículo" (no de la
   * URL), quitarlo vía chip no funcionaría (la cookie lo re-aplicaría); el
   * banner de MyVehicleBanner es quien lo gestiona.
   */
  hideVehicleChips?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "Catalog" });
  const stockLabels = Object.fromEntries(
    stockStatuses.map((status) => [status, t(`stockStatus.${status}`)]),
  ) as Record<StockStatus, string>;
  const chips = getActiveFilterChips(
    hideVehicleChips ? { ...filters, vehicleMake: "", vehicleModel: "", vehicleYear: "" } : filters,
    sort,
    options,
    t("availabilityLegend"),
    stockLabels,
  );

  if (chips.length === 0) {
    return null;
  }

  return (
    <section className="rounded-ca-surface border border-ca-border bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-ca-navy-950">Filtros activos</p>
          <p className="mt-1 text-xs font-medium text-ca-text-secondary">
            Quita un filtro específico o limpia todo para ampliar resultados.
          </p>
        </div>
        <Link
          className="inline-flex h-9 items-center justify-center rounded-ca-control border border-ca-border bg-white px-3 text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white"
          href={sort === "relevance" ? "/catalog" : { pathname: "/catalog", query: { sort } }}
        >
          Limpiar todo
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={chip.label}
            aria-label={t("removeFilter", { filter: chip.label })}
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

function getActiveFilterChips(
  filters: CatalogFilters,
  sort: CatalogSort,
  options: CatalogFilterOptions,
  availabilityLabel: string,
  stockLabels: Record<StockStatus, string>,
): FilterChip[] {
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

  filters.categories.forEach((slug) => {
    chips.push({
      label: `Categoría: ${categoryLabelOf(options, slug)}`,
      href: buildCatalogHref(filters, sort, {
        categories: filters.categories.filter((item) => item !== slug),
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
      label: `${availabilityLabel}: ${stockLabels[status]}`,
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

function buildCatalogHref(
  filters: CatalogFilters,
  sort: CatalogSort,
  patch: FilterPatch,
): LocaleHref {
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

  return { pathname: "/catalog", query: toLinkQuery(params) } as const;
}

function appendParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.append(key, value);
  }
}
