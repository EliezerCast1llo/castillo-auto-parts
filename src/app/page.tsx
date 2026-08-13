import { CategoryProductRails } from "@/components/home/category-product-rails";
import { CategoryQuickLinks } from "@/components/home/category-rail";
import { SiteHeader } from "@/components/site-header";
import { SearchHero } from "@/components/home/search-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { getCatalogFacets, getFeaturedCatalogProductsResult } from "@/data/products";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [filterOptions, featuredResult] = await Promise.all([
    getCatalogFacets(),
    getFeaturedCatalogProductsResult(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildWebSiteJsonLd()} />
      <SiteHeader variant="hero" />
      <SearchHero filterOptions={filterOptions} />

      <div className="ca-premium-shell">
        {/* La home es una sucesión de producto: un bloque por categoría. Las
            promesas del sitio se dicen una vez, en el hero, y la navegación
            por marca vive en el footer, que ya es el índice del sitio. */}
        <div className="ca-container space-y-10 pb-14 pt-8 lg:pt-28">
          <CategoryQuickLinks options={filterOptions} />
          <CategoryProductRails catalogStatus={featuredResult.status} options={filterOptions} />
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
