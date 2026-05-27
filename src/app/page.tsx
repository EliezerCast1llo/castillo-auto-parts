import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryQuickLinks } from "@/components/home/category-rail";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HomeHeader } from "@/components/home/home-header";
import { SearchHero } from "@/components/home/search-hero";
import { TrustStrip } from "@/components/home/trust-strip";
import { PopularSearches } from "@/components/product/popular-searches";
import { getCatalogFilterOptions } from "@/data/catalog-filters";
import { getCatalogProductsResult, getFeaturedCatalogProductsResult } from "@/data/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [catalogResult, featuredResult] = await Promise.all([
    getCatalogProductsResult(),
    getFeaturedCatalogProductsResult(),
  ]);
  const filterOptions = getCatalogFilterOptions(catalogResult.products);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <HomeHeader />
      <SearchHero filterOptions={filterOptions} />

      <div className="ca-premium-shell">
        <div className="ca-container space-y-10 pb-14 pt-8 lg:pt-28">
          <TrustStrip />
          <BrandStrip />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <PopularSearches />
            <CategoryQuickLinks />
          </div>
          <FeaturedProducts catalogStatus={featuredResult.status} products={featuredResult.products} />
        </div>
      </div>
    </main>
  );
}
