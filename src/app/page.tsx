import Link from "next/link";
import { CheckCircle2, MapPin, ShoppingCart } from "lucide-react";
import { CatalogFilterForm } from "@/components/product/catalog-filter-form";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { VehicleSearchPanel } from "@/components/product/vehicle-search-panel";
import { SiteHeader } from "@/components/site-header";
import { getCatalogFilterOptions, getEmptyCatalogFilters } from "@/data/catalog-filters";
import { getFeaturedCatalogProducts } from "@/data/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getFeaturedCatalogProducts();
  const filters = getEmptyCatalogFilters();
  const filterOptions = getCatalogFilterOptions(products);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <CatalogFilterForm>
            <VehicleSearchPanel filters={filters} options={filterOptions} />
            <ProductFilters activeFilterCount={0} filters={filters} options={filterOptions} />
          </CatalogFilterForm>
        </aside>

        <section className="space-y-5">
          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-sm font-semibold text-success">Catálogo inicial</p>
            <h2 className="mt-1 text-2xl font-bold text-primary">
              Encuentra el repuesto correcto para tu vehículo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Catálogo inicial para validar búsqueda, filtros, compatibilidad, retiro en bodega y
              envío local en San Salvador y Santa Tecla.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <TrustBadge icon={<CheckCircle2 className="h-5 w-5" />} label="Compatibilidad clara" />
              <TrustBadge icon={<MapPin className="h-5 w-5" />} label="Retiro o envío local" />
              <TrustBadge icon={<ShoppingCart className="h-5 w-5" />} label="Compra invitada" />
            </div>
            <Link
              href="/catalog"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
            >
              Ver catálogo
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold">
      <span className="text-success">{icon}</span>
      {label}
    </div>
  );
}
