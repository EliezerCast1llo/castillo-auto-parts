import type { MetadataRoute } from "next";
import { getCatalogFacets, getCatalogSitemapEntries } from "@/data/products";
import { vehicleMakeSlug } from "@/data/vehicle-catalog";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/ayuda`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Páginas de producto con fecha real de última modificación
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const entries = await getCatalogSitemapEntries();
    productPages = entries.map(({ slug, lastModified }) => ({
      url: `${SITE_URL}/product/${slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Si la DB no está disponible en build, omitir productos
  }

  // Landing pages por marca de vehículo
  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const facets = await getCatalogFacets();
    vehiclePages = facets.vehicleMakes.map((make) => ({
      url: `${SITE_URL}/vehiculos/${vehicleMakeSlug(make)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Si la DB no está disponible en build, omitir marcas
  }

  return [...staticPages, ...vehiclePages, ...productPages];
}
