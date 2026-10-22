import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/site";

/** Rutas privadas del storefront, que ahora viven bajo un prefijo de idioma. */
const PRIVATE_STOREFRONT_PATHS = ["/auth/", "/checkout", "/cart", "/orders/", "/account/"];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = SITE_URL;

  // Sin expandir por idioma, `/auth/` ya no coincidiría con nada: la ruta real
  // es `/es/auth/` o `/en/auth/`.
  const localizedPrivatePaths = locales.flatMap((locale) =>
    PRIVATE_STOREFRONT_PATHS.map((path) => `/${locale}${path}`),
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", ...localizedPrivatePaths],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
