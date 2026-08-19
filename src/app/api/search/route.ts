/**
 * GET /api/search?q=<query>
 *
 * Route Handler de búsqueda en tiempo real para el autocomplete del header.
 *
 * Consulta la base de datos con select/take mínimo para evitar cargar todo el
 * catálogo en memoria. Fuera de producción conserva fallback mock si la DB no
 * está disponible.
 *
 * Límites:
 *   - q < 2 caracteres → array vacío (evita queries triviales).
 *   - q > 100 caracteres → 400 (previene abuso).
 *   - Máximo 6 resultados.
 *   - Rate limit ligero por IP.
 *   - Cache de 30 segundos en CDN (stale-while-revalidate).
 */

import { type NextRequest, NextResponse } from "next/server";
import { searchCatalogProducts } from "@/data/products";
import { formatCurrency } from "@/lib/money";
import { createSearchRateLimiter, type AsyncRateLimiter } from "@/lib/rate-limit-redis";
import { getClientIp } from "@/lib/request-ip";

const MAX_RESULTS = 6;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
let _searchRateLimiter: AsyncRateLimiter | undefined;

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

  const rateLimitKey = getSearchRateLimitKey(request);
  const rateLimiter = (_searchRateLimiter ??= createSearchRateLimiter());
  const check = await rateLimiter.check(rateLimitKey);
  if (!check.allowed) {
    return NextResponse.json(
      { error: "Demasiadas búsquedas. Intenta nuevamente en unos segundos." },
      {
        headers: { "Retry-After": String(check.retryAfterSeconds) },
        status: 429,
      },
    );
  }

  const attempt = await rateLimiter.registerFailure(rateLimitKey);
  if (!attempt.allowed) {
    return NextResponse.json(
      { error: "Demasiadas búsquedas. Intenta nuevamente en unos segundos." },
      {
        headers: { "Retry-After": String(attempt.retryAfterSeconds) },
        status: 429,
      },
    );
  }

  const matched = await searchCatalogProducts(q, MAX_RESULTS);
  const results: SearchResult[] = matched.products.map((product) => ({
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

function getSearchRateLimitKey(request: NextRequest) {
  return `search:ip:${getClientIp(request.headers)}`;
}
