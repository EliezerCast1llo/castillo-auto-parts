import { buttonVariants } from "@/components/ui/button";
import type { Metadata } from "next";
import { Link } from "@/lib/i18n/navigation";
import { notFound } from "next/navigation";
import { Car, ChevronRight, SlidersHorizontal } from "lucide-react";
import { CatalogPagination } from "@/components/catalog-pagination";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  parseCatalogFilters,
  parseCatalogSort,
  type CatalogSearchParams,
} from "@/data/catalog-filters";
import { getCatalogFacets, getFilteredCatalogProducts } from "@/data/products";
import { findMakeBySlug, vehicleMakeSlug } from "@/data/vehicle-catalog";

import { localizedAlternates } from "@/lib/i18n/metadata";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type VehicleMakePageProps = {
  params: Promise<{ locale: string; make: string }>;
  searchParams?: Promise<CatalogSearchParams>;
};

async function resolveMake(slug: string) {
  const facets = await getCatalogFacets();
  return findMakeBySlug(slug, facets.vehicleMakes);
}

export async function generateMetadata({ params }: VehicleMakePageProps): Promise<Metadata> {
  const { make: slug } = await params;
  const locale = await resolveAndPublishRouteLocale(params);
  const make = await resolveMake(slug);

  // Sin sufijo: el template del layout ya agrega "| Castillo Auto Parts", y
  // repetirlo acá lo duplicaba.
  const tMeta = await getTranslations({ locale, namespace: "Vehicles" });
  if (!make) return { title: tMeta("notFoundTitle") };

  return {
    title: tMeta("metadataTitle", { make }),
    description: `Explora repuestos automotrices para vehículos ${make}. Filtra por categoría y revisa los vehículos compatibles.`,
    alternates: localizedAlternates(
      { pathname: "/vehicles/[make]", params: { make: vehicleMakeSlug(make) } },
      locale,
    ),
  };
}

export default async function VehicleMakePage({ params, searchParams }: VehicleMakePageProps) {
  const locale = await resolveAndPublishRouteLocale(params);
  const tCatalog = await getTranslations({ locale, namespace: "Catalog" });
  const tVehicles = await getTranslations({ locale, namespace: "Vehicles" });
  const { make: slug } = await params;
  const make = await resolveMake(slug);

  if (!make) notFound();

  const resolvedParams = searchParams ? await searchParams : {};
  const filters = parseCatalogFilters(resolvedParams);
  const sort = parseCatalogSort(resolvedParams);
  const page = Math.max(1, Number(resolvedParams.page ?? 1) || 1);

  // La marca de la URL manda sobre cualquier query param
  filters.vehicleMake = make;

  const { products, totalCount, totalPages, currentPage, status } =
    await getFilteredCatalogProducts(filters, page, sort, locale);

  return (
    <main className="min-h-screen bg-ca-bg text-ca-text">
      <SiteHeader locale={locale} />

      <div className="ca-container py-6">
        <nav
          aria-label={tCatalog("breadcrumbAriaLabel")}
          className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-ca-text-secondary"
        >
          <Link className="transition hover:text-ca-navy" href="/">
            {tVehicles("home")}
          </Link>
          <ChevronRight className="h-4 w-4 text-ca-text-secondary/50" />
          <Link className="transition hover:text-ca-navy" href="/catalog">
            {tVehicles("catalogLink")}
          </Link>
          <ChevronRight className="h-4 w-4 text-ca-text-secondary/50" />
          <span className="text-ca-navy">{make}</span>
        </nav>

        <section className="mt-5 overflow-hidden rounded-ca-surface border border-ca-border bg-ca-surface">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-ca-control bg-ca-navy text-white">
                <Car className="h-7 w-7" strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-xs font-bold text-ca-text-secondary">
                  {tVehicles("eyebrow")}
                </p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-ca-navy sm:text-ca-title">
                  {tVehicles("title", { make })}
                </h1>
                <p className="mt-1 text-sm leading-6 text-ca-text-secondary">
                  {tVehicles("summary", { count: totalCount, make })}
                </p>
              </div>
            </div>
            <Link
              className={buttonVariants()}
              href={{ pathname: "/catalog", query: { vehicleMake: make } }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {tVehicles("filterByModel")}
            </Link>
          </div>
        </section>

        <section className="mt-6 space-y-5">
          {status === "unavailable" ? (
            <div className="rounded-ca-surface border border-danger/20 bg-ca-surface p-6">
              <p className="text-sm font-bold text-danger">No disponible</p>
              <h2 className="mt-1 text-xl font-bold text-ca-navy">
                {tCatalog("unavailableTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ca-text-secondary">
                {tCatalog("unavailableRetry")}
              </p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.sku} locale={locale} product={product} />
                ))}
              </div>
              <CatalogPagination locale={locale}
                basePath={{ pathname: "/vehicles/[make]", params: { make: vehicleMakeSlug(make) } }}
                currentPage={currentPage}
                totalPages={totalPages}
                searchParams={resolvedParams}
              />
            </>
          ) : (
            <EmptyState
              actionHref="/catalog"
              actionLabel={tCatalog("viewFullCatalog")}
              description={`Todavía no hay repuestos publicados para ${make}. Escríbenos y te ayudamos a ubicar el repuesto correcto.`}
              showWhatsApp
              title={tCatalog("noPartsFor", { make })}
            />
          )}
        </section>
      </div>
      <SiteFooter locale={locale} />
    </main>
  );
}
