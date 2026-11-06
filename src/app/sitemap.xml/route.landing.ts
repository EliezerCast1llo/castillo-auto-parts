import { landingSiteUrl } from "@/lib/landing-site-url";

export const dynamic = "force-static";

/**
 * Las dos versiones, cada una con su URL y declarando a la otra.
 *
 * Es lo que permite que un buscador indexe el inglés por separado en vez de
 * tratarlo como contenido duplicado del español.
 */
export function GET() {
  const site = landingSiteUrl();
  const pages = [
    { loc: `${site}/`, locale: "es" },
    { loc: `${site}/en`, locale: "en" },
  ];

  const urls = pages
    .map(
      ({ loc }) =>
        `<url><loc>${loc}</loc>` +
        `<xhtml:link rel="alternate" hreflang="es" href="${site}/"/>` +
        `<xhtml:link rel="alternate" hreflang="en" href="${site}/en"/>` +
        `<xhtml:link rel="alternate" hreflang="x-default" href="${site}/"/>` +
        `</url>`,
    )
    .join("");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
