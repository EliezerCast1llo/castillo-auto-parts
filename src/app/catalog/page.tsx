import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { VehicleSearchPanel } from "@/components/product/vehicle-search-panel";
import { SiteHeader } from "@/components/site-header";
import { getCatalogProducts } from "@/data/products";

export const metadata = {
  title: "Catalogo | Castillo Auto Parts",
  description: "Catalogo inicial de repuestos automotrices.",
};

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const products = await getCatalogProducts();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="space-y-4">
          <VehicleSearchPanel />
          <ProductFilters />
        </aside>

        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-3 rounded-md border border-border bg-card p-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-success">Inventario inicial</p>
              <h2 className="mt-1 text-2xl font-bold text-primary">Catalogo de repuestos</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Primer listado de productos para probar filtros, compatibilidad, stock y tarjetas de
                producto mientras se valida el inventario real.
              </p>
            </div>
            <div className="rounded-md bg-background px-3 py-2 text-sm font-semibold text-muted-foreground">
              {products.length} productos
            </div>
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
