import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SortDropdown } from "@/components/catalog/sort-dropdown";
import { CatalogActiveFilters } from "@/components/product/catalog-active-filters";
import { CatalogFilterForm } from "@/components/product/catalog-filter-form";
import { CatalogPagination } from "@/components/catalog-pagination";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { VehicleSearchPanel } from "@/components/product/vehicle-search-panel";
import { FilterDrawer } from "@/components/catalog/filter-drawer";
import { SiteHeader } from "@/components/site-header";
import {
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
    ? `Repuestos automotrices ${parts.join(", ")} disponibles en El Salvador. Stock visible, compatibilidad clara.`
    : "Catálogo completo de repuestos automotrices para El Salvador. Filtra por vehículo, marca o categoría.";

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
  const filters = parseCatalogFilters(resolvedParams);
  const sort = parseCatalogSort(resolvedParams);
  const page = Math.max(1, Number(resolvedParams.page ?? 1) || 1);

  const [catalogResult, filterOptions] = await Promise.all([
    getFilteredCatalogProducts(filters, page, sort),
    getCatalogFacets(),
  ]);

  const { products: filteredProducts, totalCount, totalPages, currentPage, source, status } = catalogResult;
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
          {/* Sidebar de filtros — solo visible en desktop */}
          <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
            {filterContent}
          </aside>

          <section className="min-w-0 space-y-5">
            <CatalogBreadcrumb filters={filters} />
            <CatalogHero />

            {status === "unavailable" ? <CatalogUnavailableState /> : null}

            {/* Barra de resultados */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-ca-border bg-white px-5 py-4 shadow-ca-soft md:flex-row md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">
                  {source === "mock" ? "Inventario de prueba" : "Inventario activo"}
                </p>
                <h2 className="mt-1 text-xl font-black text-ca-navy-950">Catálogo de repuestos</h2>
                <p className="mt-1 text-sm leading-6 text-ca-text-secondary">
                  {getCatalogSummary(filters, totalCount)}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <span className="inline-flex h-11 items-center justify-center rounded-xl bg-ca-background px-3 text-sm font-bold text-ca-text-secondary">
                  {totalCount} {totalCount === 1 ? "producto" : "productos"}
                </span>
                {totalPages > 1 ? (
                  <span className="inline-flex h-11 items-center text-sm font-bold text-ca-text-secondary">
                    Pág. {currentPage}/{totalPages}
                  </span>
                ) : null}
                <SortDropdown value={sort} />
              </div>
            </div>

            <CatalogActiveFilters filters={filters} sort={sort} />

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
        Intenta nuevamente en unos minutos. No mostramos productos de prueba cuando la base de datos no responde.
      </p>
    </div>
  );
}

function getCatalogSummary(filters: ReturnType<typeof parseCatalogFilters>, totalCount: number) {
  if (totalCount === 0) {
    return "Ajusta la búsqueda o consulta con asesoría para ubicar el repuesto correcto.";
  }

  if (filters.query) {
    return `Resultados para "${filters.query}" con filtros de vehículo, marca y disponibilidad cuando aplican.`;
  }

  if (filters.categories.length > 0) {
    return `Productos filtrados por ${filters.categories[0]} con stock y precio visibles.`;
  }

  return "Explora repuestos con stock visible, precio final con IVA incluido y filtros rápidos.";
}

function CatalogHero() {
  return (
    <section className="overflow-hidden rounded-2xl border border-ca-border bg-white shadow-ca-soft">
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_240px] md:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">
            Compatibilidad clara
          </p>
          <h1 className="mt-2 max-w-2xl text-2xl font-black leading-tight text-ca-navy-950 sm:text-3xl">
            Encuentra el repuesto correcto antes de pagar
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ca-text-secondary">
            Filtra por vehículo, categoría, marca o número de parte. Precio, stock y compatibilidad visibles desde la lista.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <HeroChip icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Pago seguro" />
            <HeroChip icon={<MapPin className="h-3.5 w-3.5" />} label="San Salvador y Santa Tecla" />
            <HeroChip icon={<SlidersHorizontal className="h-3.5 w-3.5" />} label="Filtros en tiempo real" />
          </div>
        </div>

        <div className="grid gap-2 rounded-xl border border-ca-border bg-ca-background p-4">
          <HeroMetric label="Catálogo MVP" value="50–80 SKUs" />
          <HeroMetric label="IVA" value="13% incluido" />
          <HeroMetric label="Retiro" value="Gratis" />
        </div>
      </div>
    </section>
  );
}

function HeroChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ca-navy-950/15 bg-ca-navy-950/5 px-3 text-xs font-bold text-ca-navy-950">
      {icon}
      {label}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ca-border bg-white p-3">
      <p className="text-xs font-semibold text-ca-text-secondary">{label}</p>
      <p className="mt-0.5 text-base font-black text-ca-navy-950">{value}</p>
    </div>
  );
}
