import { BrandStrip } from "@/components/home/brand-strip";
import { CategoryQuickLinks } from "@/components/home/category-rail";
import { FeaturedProducts } from "@/components/home/featured-products";
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
        {/* Las promesas del sitio (garantía, entrega, pago seguro) se decían
            tres veces antes del primer producto: barra superior, chips del
            hero y una franja de confianza. Se queda solo la del hero. */}
        <div className="ca-container space-y-10 pb-14 pt-8 lg:pt-28">
          <CategoryQuickLinks options={filterOptions} />
          <BrandStrip
            partBrands={filterOptions.brands}
            vehicleMakes={filterOptions.vehicleMakes}
          />
          <FeaturedProducts catalogStatus={featuredResult.status} products={featuredResult.products} />
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
