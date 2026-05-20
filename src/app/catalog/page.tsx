import Link from "next/link";
import { CatalogActiveFilters } from "@/components/product/catalog-active-filters";
import { CatalogFilterForm } from "@/components/product/catalog-filter-form";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { VehicleSearchPanel } from "@/components/product/vehicle-search-panel";
import { SiteHeader } from "@/components/site-header";
import { MapPin, ShieldCheck, SlidersHorizontal } from "lucide-react";
import {
  countActiveCatalogFilters,
  filterCatalogProducts,
  getCatalogFilterOptions,
  parseCatalogFilters,
  type CatalogSearchParams,
} from "@/data/catalog-filters";
import { getCatalogProducts } from "@/data/products";

export const metadata = {
  title: "Catálogo | Castillo Auto Parts",
  description: "Catálogo inicial de repuestos automotrices.",
};

export const dynamic = "force-dynamic";

type CatalogPageProps = {
  searchParams?: Promise<CatalogSearchParams>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const filters = parseCatalogFilters(searchParams ? await searchParams : {});
  const products = await getCatalogProducts();
  const filteredProducts = filterCatalogProducts(products, filters);
  const filterOptions = getCatalogFilterOptions(products);
  const activeFilterCount = countActiveCatalogFilters(filters);
  const filterKey = JSON.stringify(filters);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <CatalogFilterForm key={filterKey}>
            <VehicleSearchPanel filters={filters} options={filterOptions} />
            <ProductFilters
              activeFilterCount={activeFilterCount}
              filters={filters}
              options={filterOptions}
            />
          </CatalogFilterForm>
        </aside>

        <section className="space-y-5">
          <CatalogHero />

          <div className="flex flex-col justify-between gap-3 rounded-md border border-border bg-card p-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-success">Inventario inicial</p>
              <h2 className="mt-1 text-2xl font-bold text-primary">Catálogo de repuestos</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Primer listado de productos para probar filtros, compatibilidad, stock y tarjetas de
                producto mientras se valida el inventario real.
              </p>
            </div>
            <div className="rounded-md bg-background px-3 py-2 text-sm font-semibold text-muted-foreground">
              {filteredProducts.length} de {products.length} productos
            </div>
          </div>

          <CatalogActiveFilters filters={filters} />

          {filteredProducts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.sku} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-primary">No encontramos productos con esos filtros</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Prueba quitar un filtro activo, buscar por número de parte o revisar otra combinación
                de vehículo.
              </p>
              <Link
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
                href="/catalog"
              >
                Limpiar filtros
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function CatalogHero() {
  return (
    <section className="overflow-hidden rounded-md bg-graphite text-white">
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_260px] md:p-6">
        <div>
          <p className="text-xs font-bold uppercase text-white/70">Compra con compatibilidad clara</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight">
            Encuentra el repuesto correcto antes de pagar
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Filtra por vehículo, categoría, marca o número de parte. Precio, stock y compatibilidad
            están visibles desde la lista para comparar rápido.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <HeroChip icon={<ShieldCheck className="h-4 w-4" />} label="Pago en línea seguro" />
            <HeroChip icon={<MapPin className="h-4 w-4" />} label="San Salvador y Santa Tecla" />
            <HeroChip icon={<SlidersHorizontal className="h-4 w-4" />} label="Filtros visibles" />
          </div>
        </div>

        <div className="grid gap-2 rounded-md bg-white/10 p-4">
          <HeroMetric label="Catálogo MVP" value="50-80 SKUs" />
          <HeroMetric label="IVA" value="13% incluido" />
          <HeroMetric label="Retiro" value="Gratis" />
        </div>
      </div>
    </section>
  );
}

function HeroChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-md bg-white/12 px-3 text-sm font-semibold">
      {icon}
      {label}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-graphite">{value}</p>
    </div>
  );
}
