import type { MetadataRoute } from "next";
import { getCatalogFacets, getCatalogSitemapEntries } from "@/data/products";
import { vehicleMakeSlug } from "@/data/vehicle-catalog";
import { defaultLocale, locales, publishedLocales } from "@/lib/i18n/config";
import { getPathname, type LocaleHref } from "@/lib/i18n/navigation";
import { SITE_URL } from "@/lib/site";

type SitemapEntry = MetadataRoute.Sitemap[number];

/**
 * Expande una ruta del storefront a una entrada por idioma, cada una con sus
 * `alternates` para que el buscador entienda que son la misma página.
 *
 * Las URLs salen de `getPathname`, no de concatenar strings: con los pathnames
 * localizados la grafía cambia por idioma (`/es/ayuda` vs `/en/help`) y armarla
 * a mano acá seria una segunda fuente de verdad destinada a divergir.
 *
 * `x-default` apunta al español: es el idioma principal del negocio y el
 * destino de los redirects permanentes desde las URLs viejas.
 */
function localizedEntries(href: LocaleHref, entry: Omit<SitemapEntry, "url">): MetadataRoute.Sitemap {
  const urlFor = (locale: (typeof locales)[number]) => `${SITE_URL}${getPathname({ href, locale })}`;

  // Los `hreflang` siguen listando todos los idiomas: le dicen al buscador que
  // la versión existe. Lo que no se ofrece para indexar es la URL en sí.
  const languages = Object.fromEntries(locales.map((locale) => [locale, urlFor(locale)]));

  return publishedLocales.map((locale) => ({
    ...entry,
    url: urlFor(locale),
    alternates: {
      languages: { ...languages, "x-default": urlFor(defaultLocale) },
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    ...localizedEntries("/", {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    }),
    ...localizedEntries("/catalog", {
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }),
    ...localizedEntries("/help", {
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  ];

  // Páginas de producto con fecha real de última modificación
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const entries = await getCatalogSitemapEntries();
    productPages = entries.flatMap(({ slug, lastModified }) =>
      localizedEntries({ pathname: "/product/[slug]", params: { slug } }, {
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );
  } catch {
    // Si la DB no está disponible en build, omitir productos
  }

  // Landing pages por marca de vehículo
  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const facets = await getCatalogFacets();
    vehiclePages = facets.vehicleMakes.flatMap((make) =>
      localizedEntries({ pathname: "/vehicles/[make]", params: { make: vehicleMakeSlug(make) } }, {
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );
  } catch {
    // Si la DB no está disponible en build, omitir marcas
  }

  return [...staticPages, ...vehiclePages, ...productPages];
}
