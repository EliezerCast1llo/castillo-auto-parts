import { CategoryProductRails } from "@/components/home/category-product-rails";
import { CategoryQuickLinks } from "@/components/home/category-rail";
import { SiteHeader } from "@/components/site-header";
import { SearchHero } from "@/components/home/search-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { getCatalogFacets, getFeaturedCatalogProductsResult } from "@/data/products";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/structured-data";
import type { Metadata } from "next";

import { localizedAlternates } from "@/lib/i18n/metadata";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveAndPublishRouteLocale(params);
  return { alternates: localizedAlternates("/", locale) };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveAndPublishRouteLocale(params);
  const [filterOptions, featuredResult] = await Promise.all([
    getCatalogFacets(locale),
    getFeaturedCatalogProductsResult(locale),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildWebSiteJsonLd(locale)} />
      <SiteHeader locale={locale} showSearch={false} />
      <SearchHero locale={locale} filterOptions={filterOptions} />

      <div className="ca-container space-y-8 py-8">
        <CategoryQuickLinks locale={locale} options={filterOptions} />
        <CategoryProductRails
          catalogStatus={featuredResult.status}
          locale={locale}
          options={filterOptions}
        />
      </div>
    </main>
  );
}
