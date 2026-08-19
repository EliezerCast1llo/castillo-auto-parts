import type { Metadata } from "next";
import Link from "next/link";
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
import {
  buildCanonicalCatalogQuery,
  countActiveCatalogFilters,
  parseCatalogFilters,
  parseCatalogSort,
  type CatalogSearchParams,
} from "@/data/catalog-filters";
import { getCatalogFacets, getFilteredCatalogProducts } from "@/data/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const filters = parseCatalogFilters(params);

  const parts: string[] = [];
  if (filters.categories.length) parts.push(filters.categories[0]);
  if (filters.brands.length) parts.push(filters.brands[0]);
  if (filters.vehicleMake) parts.push(filters.vehicleMake);
  if (filters.query) parts.push(`"${filters.query}"`);

  const title = parts.length
    ? `${parts.join(" · ")} | Catálogo | Castillo Auto Parts`
    : "Catálogo de repuestos | Castillo Auto Parts";

  const description = parts.length
    ? `Repuestos automotrices: ${parts.join(", ")}. Busca opciones por vehículo, marca o categoría.`
    : "Explora repuestos automotrices y filtra por vehículo, marca, categoría o número de parte.";

  return {
    title,
    description,
    // Canonical siempre al catálogo limpio: las combinaciones de filtros por
    // query param no deben competir entre sí como contenido duplicado.
    alternates: { canonical: "/catalog" },
  };
}

type CatalogPageProps = {
  searchParams?: Promise<CatalogSearchParams>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};

  // Las URLs viejas traían el estado de stock en español
  // (`?stock=Últimas unidades`). Se siguen entendiendo, pero se redirige al
  // identificador canónico para que los links compartidos se auto-curen.
  const canonicalQuery = buildCanonicalCatalogQuery(resolvedParams);
  if (canonicalQuery !== null) {
    permanentRedirect(canonicalQuery ? `/catalog?${canonicalQuery}` : "/catalog");
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
    getFilteredCatalogProducts(filters, page, sort),
    getCatalogFacets(),
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
      <SiteHeader />

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
            <CatalogBreadcrumb filters={filters} />

            {status === "unavailable" ? <CatalogUnavailableState /> : null}

            {/* Encabezado y barra de resultados en una sola fila: los productos
                empiezan lo antes posible en lugar de tras un banner. */}
            <div className="flex flex-col justify-between gap-3 border-b border-ca-border pb-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-xl font-black text-ca-navy-950">Catálogo de repuestos</h1>
                <p className="mt-1 text-sm text-ca-text-secondary">
                  {getCatalogSummary(filters, totalCount)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-ca-navy-950">
                  {totalCount} {totalCount === 1 ? "producto" : "productos"}
                </span>
                {totalPages > 1 ? (
                  <span className="text-sm text-ca-text-secondary">
                    Pág. {currentPage}/{totalPages}
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
                actionLabel={activeFilterCount > 0 ? "Limpiar filtros" : undefined}
                description={
                  totalCount === 0
                    ? "El catálogo está disponible pero todavía no hay inventario publicado."
                    : "Prueba quitar un filtro, buscar por número de parte o escríbenos y te ayudamos a ubicar el repuesto correcto."
                }
                showWhatsApp
                suggestions={["amortiguadores", "pastillas de freno", "filtro de aceite", "bujías"]}
                title={
                  totalCount === 0
                    ? "Aún no hay productos activos"
                    : "No encontramos repuestos con esos filtros"
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

function CatalogBreadcrumb({ filters }: { filters: ReturnType<typeof parseCatalogFilters> }) {
  const current = filters.categories[0] ?? (filters.query ? `Búsqueda: ${filters.query}` : "Catálogo");

  return (
    <nav
      aria-label="Ruta del catálogo"
      className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-ca-text-secondary"
    >
      <Link className="transition hover:text-ca-navy-950" href="/">
        Inicio
      </Link>
      <ChevronRight className="h-4 w-4 text-ca-text-secondary/50" />
      {current === "Catálogo" ? (
        <span className="text-ca-navy-950">Catálogo</span>
      ) : (
        <>
          <Link className="transition hover:text-ca-navy-950" href="/catalog">
            Catálogo
          </Link>
          <ChevronRight className="h-4 w-4 text-ca-text-secondary/50" />
          <span className="text-ca-navy-950">{current}</span>
        </>
      )}
    </nav>
  );
}

function CatalogUnavailableState() {
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-ca-soft">
      <p className="text-sm font-black uppercase tracking-widest text-red-500">No disponible</p>
      <h2 className="mt-1 text-xl font-black text-ca-navy-950">Catálogo temporalmente no disponible</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ca-text-secondary">
        No pudimos cargar el catálogo en este momento. Intenta nuevamente en unos minutos.
      </p>
    </div>
  );
}

function getCatalogSummary(filters: ReturnType<typeof parseCatalogFilters>, totalCount: number) {
  if (totalCount === 0) {
    return "Ajusta la búsqueda o consulta con asesoría para ubicar el repuesto correcto.";
  }

  if (filters.query) {
    return `Resultados para "${filters.query}" con filtros de vehículo, marca y disponibilidad.`;
  }

  if (filters.categories.length > 0) {
    return `Productos filtrados por ${filters.categories[0]} con disponibilidad y precio visibles.`;
  }

  return "Explora repuestos por vehículo, marca, categoría o número de parte. Los precios incluyen IVA.";
}
