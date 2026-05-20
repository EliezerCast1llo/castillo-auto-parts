import Link from "next/link";
import { CheckCircle2, MapPin, ShoppingCart } from "lucide-react";
import { PopularSearches } from "@/components/product/popular-searches";
import { ProductCard } from "@/components/product/product-card";
import { SiteHeader } from "@/components/site-header";
import { getFeaturedCatalogProducts } from "@/data/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getFeaturedCatalogProducts();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-5 rounded-md border border-border bg-card p-5 md:grid-cols-[minmax(0,1fr)_280px] md:p-6">
          <div>
            <p className="text-sm font-semibold text-success">Castillo Auto Parts</p>
            <h2 className="mt-1 max-w-2xl text-3xl font-bold leading-tight text-primary">
              Compra repuestos con compatibilidad clara antes de pagar
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Catálogo automotriz para El Salvador con stock visible, compra invitada y opciones de
              retiro en bodega o envío local en San Salvador y Santa Tecla.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white"
              >
                Ver catálogo
              </Link>
              <Link
                href="/catalog"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary"
              >
                Buscar por vehículo
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <TrustBadge icon={<CheckCircle2 className="h-5 w-5" />} label="Compatibilidad clara" />
            <TrustBadge icon={<MapPin className="h-5 w-5" />} label="Retiro o envío local" />
            <TrustBadge icon={<ShoppingCart className="h-5 w-5" />} label="Compra invitada" />
          </div>
        </section>

        <PopularSearches />

        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-success">Catálogo MVP</p>
              <h2 className="text-xl font-bold text-primary">Productos destacados</h2>
            </div>
            <Link className="text-sm font-semibold text-primary" href="/catalog">
              Ver todo el catálogo
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
