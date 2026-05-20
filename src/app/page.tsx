import Link from "next/link";
import { CategoryRail } from "@/components/home/category-rail";
import { HomeHero } from "@/components/home/home-hero";
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
        <HomeHero />
        <PopularSearches />
        <CategoryRail />

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
