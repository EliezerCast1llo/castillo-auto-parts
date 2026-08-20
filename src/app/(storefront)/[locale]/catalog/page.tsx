import type { Metadata } from "next";
import { Link } from "@/lib/i18n/navigation";
import { permanentRedirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SortDropdown } from "@/components/catalog/sort-dropdown";
import { CatalogActiveFilters } from "@/components/product/catalog-active-filters";
import { CatalogFilterForm } from "@/components/product/catalog-filter-form";
import { CatalogPagination } from "@/components/catalog-pagination";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { VehicleSearchPanel } from "@/components/product/vehicle-search-panel";
import { FilterDrawer } from "@/components/catalog/filter-drawer";
import { MyVehicleBanner } from "@/components/catalog/my-vehicle-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatMyVehicle } from "@/lib/my-vehicle";
import { getMyVehicle } from "@/lib/my-vehicle-server";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import {
  buildCanonicalCatalogQuery,
  categoryLabelOf,
  countActiveCatalogFilters,
  parseCatalogFilters,
  parseCatalogSort,
  type CatalogSearchParams,
} from "@/data/catalog-filters";
import { getCatalogFacets, getFilteredCatalogProducts } from "@/data/products";

import { localizedAlternates } from "@/lib/i18n/metadata";
import { localizePath } from "@/lib/i18n/path";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getTranslations } from "next-intl/server";

/**
 * Atajos de la pantalla sin resultados.
 *
 * La `query` va en el idioma del contenido y no se traduce: es lo que se compara
 * contra los nombres y descripciones de los productos. Solo el label cambia de
 * idioma. Traducir también la query hacía que en inglés cada atajo llevara a
 * otra búsqueda vacía.
 *
 * Y es la raíz de la palabra, no el término que se muestra: la búsqueda hace
 * `contains` sobre el nombre, así que "pastillas de freno" no coincide con
 * "Pastillas de freno delanteras Toyota Corolla" pero "pastilla" sí. Tres de
 * los cuatro atajos originales devolvían cero resultados por eso, en español
 * también.
 */
const SEARCH_SUGGESTIONS = [
  { key: "filters", query: "filtro" },
  { key: "brakePads", query: "pastilla" },
  { key: "sparkPlugs", query: "bujía" },
  { key: "brakes", query: "freno" },
] as const;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const params = searchParams ? await searchParams : {};
  const filters = parseCatalogFilters(params);

  // Las facetas resuelven el nombre visible de la categoría: el filtro guarda
  // el slug y el título tiene que decir "Frenos", no "frenos". La lectura no
  // agrega costo, es la misma entrada de caché que consume la página.
  const facets = await getCatalogFacets(locale);

  const parts: string[] = [];
  if (filters.categories.length) parts.push(categoryLabelOf(facets, filters.categories[0]));
  if (filters.brands.length) parts.push(filters.brands[0]);
  if (filters.vehicleMake) parts.push(filters.vehicleMake);
  if (filters.query) parts.push(`"${filters.query}"`);

  const t = await getTranslations({ locale, namespace: "Catalog" });

  const title = parts.length
    ? t("metaTitleFiltered", { filters: parts.join(" · ") })
    : t("metaTitle");

  const description = parts.length
    ? t("metaDescriptionFiltered", { filters: parts.join(", ") })
    : t("metaDescription");

  return {
    title,
    description,
    // Canonical siempre al catálogo limpio del idioma actual: las combinaciones
    // de filtros por query param no deben competir entre sí como contenido
    // duplicado.
    alternates: localizedAlternates("/catalog", locale),
  };
}

type CatalogPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<CatalogSearchParams>;
};

export default async function CatalogPage({ params: routeParams, searchParams }: CatalogPageProps) {
  const locale = await resolveAndPublishRouteLocale(routeParams);
  const t = await getTranslations({ locale, namespace: "Catalog" });
  const resolvedParams = searchParams ? await searchParams : {};

  // Las URLs viejas traían el estado de stock y la categoría en español
  // (`?stock=Últimas unidades`, `?category=Frenos`). Se siguen entendiendo,
  // pero se redirige al identificador canónico para que los links compartidos
  // se auto-curen.
  //
  // El destino lleva el prefijo de idioma: `permanentRedirect` es el de
  // `next/navigation` y no localiza nada, así que mandar "/catalog" pelado
  // sacaba del idioma a quien navegaba en inglés.
  const canonicalQuery = buildCanonicalCatalogQuery(resolvedParams);
  if (canonicalQuery !== null) {
    const target = localizePath("/catalog", locale);
    permanentRedirect(canonicalQuery ? `${target}?${canonicalQuery}` : target);
  }

  const filters = parseCatalogFilters(resolvedParams);
  const sort = parseCatalogSort(resolvedParams);
  const page = Math.max(1, Number(resolvedParams.page ?? 1) || 1);

  // "Mi vehículo": si la URL no trae filtro de vehículo, pre-aplicar la
  // selección guardada en cookie (el usuario la quita desde el banner).
  const myVehicle = await getMyVehicle();
  const vehicleFromCookie = !filters.vehicleMake && myVehicle ? myVehicle : null;
  if (vehicleFromCookie) {
    filters.vehicleMake = vehicleFromCookie.make;
    filters.vehicleModel = vehicleFromCookie.model ?? "";
    filters.vehicleYear = vehicleFromCookie.year ?? "";
  }

  const [catalogResult, filterOptions] = await Promise.all([
    getFilteredCatalogProducts(filters, page, sort, locale),
    getCatalogFacets(locale),
  ]);

  const { products: filteredProducts, totalCount, totalPages, currentPage, status } = catalogResult;
  const activeFilterCount = countActiveCatalogFilters(filters);
  const filterKey = JSON.stringify(filters);

  const filterContent = (
    <CatalogFilterForm key={filterKey}>
      {sort !== "relevance" ? <input name="sort" type="hidden" value={sort} /> : null}
      <VehicleSearchPanel filters={filters} options={filterOptions} />
      <ProductFilters
        activeFilterCount={activeFilterCount}
        filters={filters}
        options={filterOptions}
      />
    </CatalogFilterForm>
  );

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <SiteHeader locale={locale} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Botón de filtros mobile + drawer */}
        <FilterDrawer activeFilterCount={activeFilterCount}>
          {filterContent}
        </FilterDrawer>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar de filtros — solo visible en desktop. La superficie la
              pone el aside: dentro solo hay secciones separadas por reglas. */}
          <aside className="hidden rounded-ca-surface border border-ca-border bg-white p-4 lg:block lg:sticky lg:top-6 lg:self-start">
            {filterContent}
          </aside>

          <section className="min-w-0 space-y-5">
            <CatalogBreadcrumb filters={filters} options={filterOptions} t={t} />

            {status === "unavailable" ? <CatalogUnavailableState t={t} /> : null}

            {/* Encabezado y barra de resultados en una sola fila: los productos
                empiezan lo antes posible en lugar de tras un banner. */}
            <div className="flex flex-col justify-between gap-3 border-b border-ca-border pb-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-xl font-black text-ca-navy-950">{t("title")}</h1>
                <p className="mt-1 text-sm text-ca-text-secondary">
                  {getCatalogSummary(t, filters, totalCount, filterOptions)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-ca-navy-950">
                  {t("productCount", { count: totalCount })}
                </span>
                {totalPages > 1 ? (
                  <span className="text-sm text-ca-text-secondary">
                    {t("pageOf", { current: currentPage, total: totalPages })}
                  </span>
                ) : null}
                <SortDropdown value={sort} />
              </div>
            </div>

            {vehicleFromCookie ? (
              <MyVehicleBanner vehicleLabel={formatMyVehicle(vehicleFromCookie)} />
            ) : null}

            <CatalogActiveFilters
              filters={filters}
              options={filterOptions}
              hideVehicleChips={Boolean(vehicleFromCookie)}
              sort={sort}
            />

            {status === "unavailable" ? null : filteredProducts.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.sku} product={product} />
                  ))}
                </div>
                <CatalogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  searchParams={resolvedParams}
                />
              </>
            ) : (
              <EmptyState
                actionHref={activeFilterCount > 0 ? "/catalog" : undefined}
                actionLabel={activeFilterCount > 0 ? t("empty.clearFilters") : undefined}
                description={
                  totalCount === 0
                    ? t("empty.noInventoryDescription")
                    : t("empty.noMatchesDescription")
                }
                showWhatsApp
                suggestions={SEARCH_SUGGESTIONS.map(({ key, query }) => ({
                  label: t(`suggestions.${key}`),
                  query,
                }))}
                title={
                  totalCount === 0
                    ? t("empty.noInventoryTitle")
                    : t("empty.noMatchesTitle")
                }
              />
            )}
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

type CatalogTranslator = Awaited<ReturnType<typeof getTranslations<"Catalog">>>;

function CatalogBreadcrumb({
  filters,
  options,
  t,
}: {
  filters: ReturnType<typeof parseCatalogFilters>;
  options: CatalogFilterOptions;
  t: CatalogTranslator;
}) {
  const catalogLabel = t("breadcrumb.catalog");
  // Booleano y no comparación de textos: una categoría que se llamara
  // "Catálogo" colapsaría la ruta en vez de mostrarse.
  const hasCurrent = Boolean(filters.categories[0] || filters.query);
  const current = filters.categories[0]
    ? categoryLabelOf(options, filters.categories[0])
    : filters.query
      ? t("breadcrumb.search", { query: filters.query })
      : catalogLabel;

  return (
    <nav
      aria-label={t("breadcrumb.ariaLabel")}
      className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-ca-text-secondary"
    >
      <Link className="transition hover:text-ca-navy-950" href="/">
        {t("breadcrumb.home")}
      </Link>
      <ChevronRight className="h-4 w-4 text-ca-text-secondary/50" />
      {!hasCurrent ? (
        <span className="text-ca-navy-950">{catalogLabel}</span>
      ) : (
        <>
          <Link className="transition hover:text-ca-navy-950" href="/catalog">
            {catalogLabel}
          </Link>
          <ChevronRight className="h-4 w-4 text-ca-text-secondary/50" />
          <span className="text-ca-navy-950">{current}</span>
        </>
      )}
    </nav>
  );
}

function CatalogUnavailableState({ t }: { t: CatalogTranslator }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-ca-soft">
      <p className="text-sm font-black uppercase tracking-widest text-red-500">
        {t("unavailable.badge")}
      </p>
      <h2 className="mt-1 text-xl font-black text-ca-navy-950">{t("unavailable.title")}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ca-text-secondary">
        {t("unavailable.description")}
      </p>
    </div>
  );
}

function getCatalogSummary(
  t: CatalogTranslator,
  filters: ReturnType<typeof parseCatalogFilters>,
  totalCount: number,
  options: CatalogFilterOptions,
) {
  if (totalCount === 0) return t("summary.empty");
  if (filters.query) return t("summary.query", { query: filters.query });
  if (filters.categories.length > 0) {
    // La etiqueta y no el slug: el filtro guarda el identificador, el resumen
    // se lee.
    return t("summary.category", {
      category: categoryLabelOf(options, filters.categories[0]),
    });
  }

  return t("summary.default");
}
