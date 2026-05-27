/**
 * GET /api/search?q=<query>
 *
 * Route Handler de búsqueda en tiempo real para el autocomplete del header.
 *
 * Reutiliza filterCatalogProducts (misma lógica que el catálogo) para que los
 * resultados del autocomplete sean siempre consistentes con la página de catálogo.
 *
 * Límites:
 *   - q < 2 caracteres → array vacío (evita queries triviales).
 *   - q > 100 caracteres → 400 (previene abuso).
 *   - Máximo 6 resultados.
 *   - Cache de 30 segundos en CDN (stale-while-revalidate).
 */

import { type NextRequest, NextResponse } from "next/server";
import { getEmptyCatalogFilters, filterCatalogProducts } from "@/data/catalog-filters";
import { getCatalogProducts } from "@/data/products";
import { formatCurrency } from "@/lib/money";

const MAX_RESULTS = 6;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

export type SearchResult = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  formattedPrice: string;
  stockStatus: string;
};

export type SearchResponse = {
  results: SearchResult[];
  query: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Query demasiado larga." }, { status: 400 });
  }

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [], query: q } satisfies SearchResponse);
  }

  const products = await getCatalogProducts();

  const matched = filterCatalogProducts(products, {
    ...getEmptyCatalogFilters(),
    query: q,
  }).slice(0, MAX_RESULTS);

  const results: SearchResult[] = matched.map((product) => ({
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    category: product.category,
    formattedPrice: formatCurrency(product.priceCents),
    stockStatus: product.stockStatus,
  }));

  return NextResponse.json({ results, query: q } satisfies SearchResponse, {
    headers: {
      // Cache 30s en CDN, sirve stale hasta 60s mientras revalida
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
