import type { CatalogProduct } from "@/data/products";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { withContext, type Thing, type WithContext } from "@/components/seo/schema-types";

/**
 * Builders de JSON-LD (schema.org). Puros y testeables: reciben datos del
 * catálogo y devuelven objetos listos para <JsonLd />.
 */

const STOCK_STATUS_TO_SCHEMA: Record<CatalogProduct["stockStatus"], string> = {
  IN_STOCK: "https://schema.org/InStock",
  LOW_STOCK: "https://schema.org/LimitedAvailability",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
};

export function buildProductJsonLd(product: CatalogProduct): WithContext<Thing> {
  return withContext({
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    ...(product.partNumber && product.partNumber !== "Sin número de parte"
      ? { mpn: product.partNumber }
      : {}),
    brand: { "@type": "Brand", name: product.brand },
    category: product.category,
    description: product.description || product.compatibility,
    url: `${SITE_URL}/product/${product.slug}`,
    ...(product.primaryImageUrl ? { image: product.primaryImageUrl } : {}),
    ...(product.vehicleCompatibilities.length > 0
      ? {
          isAccessoryOrSparePartFor: product.vehicleCompatibilities.map((vehicle) => ({
            "@type": "Car",
            brand: { "@type": "Brand", name: vehicle.make },
            model: vehicle.model,
            vehicleModelDate: `${vehicle.yearFrom}/${vehicle.yearTo}`,
          })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: STOCK_STATUS_TO_SCHEMA[product.stockStatus],
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  });
}

export type BreadcrumbEntry = { name: string; path: string };

export function buildBreadcrumbJsonLd(entries: BreadcrumbEntry[]): WithContext<Thing> {
  return withContext({
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: `${SITE_URL}${entry.path}`,
    })),
  });
}

export function buildOrganizationJsonLd(): WithContext<Thing> {
  return withContext({
    "@type": "AutoPartsStore",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    areaServed: ["San Salvador", "Santa Tecla"],
    currenciesAccepted: "USD",
  });
}

export function buildWebSiteJsonLd(): WithContext<Thing> {
  return withContext({
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/catalog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}
