import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://castilloautoparts.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout", "/cart", "/orders/", "/account/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
