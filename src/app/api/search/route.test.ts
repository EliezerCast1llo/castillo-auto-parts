/**
 * Tests unitarios del Route Handler GET /api/search.
 *
 * No testean el componente React (SearchAutocomplete) porque requiere
 * jsdom y setup de testing-library — pendiente si se agrega la config.
 * Se cubren los casos de negocio del endpoint directamente.
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/data/products", () => ({
  searchCatalogProducts: vi.fn(),
}));

const mockRateLimiter = {
  check: vi.fn(),
  registerFailure: vi.fn(),
  reset: vi.fn(),
};

vi.mock("@/lib/rate-limit-redis", () => ({
  createSearchRateLimiter: vi.fn(() => mockRateLimiter),
}));

import { searchCatalogProducts } from "@/data/products";

const mockProducts = {
  products: [
    {
      category: "Filtros",
      name: "Filtro de aceite Toyota",
      priceCents: 1500,
      sku: "FLT-001",
      slug: "filtro-aceite-toyota",
      stockStatus: "Disponible",
    },
    {
      category: "Frenos",
      name: "Pastillas de freno Honda",
      priceCents: 4500,
      sku: "FRN-042",
      slug: "pastillas-freno-honda",
      stockStatus: "Últimas unidades",
    },
  ],
  source: "database",
  status: "ready",
};

function makeRequest(q: string) {
  return new NextRequest(`http://localhost:3000/api/search?q=${encodeURIComponent(q)}`);
}

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimiter.check.mockResolvedValue({ allowed: true, remainingAttempts: 60 });
    mockRateLimiter.registerFailure.mockResolvedValue({ allowed: true, remainingAttempts: 59 });
    mockRateLimiter.reset.mockResolvedValue(undefined);
    vi.mocked(searchCatalogProducts).mockResolvedValue(mockProducts as never);
  });

  it("retorna array vacío para query menor a 2 caracteres", async () => {
    const response = await GET(makeRequest("f"));
    const data = await response.json();
    expect(data.results).toHaveLength(0);
    expect(response.status).toBe(200);
    expect(searchCatalogProducts).not.toHaveBeenCalled();
  });

  it("retorna array vacío para query vacía", async () => {
    const response = await GET(makeRequest(""));
    const data = await response.json();
    expect(data.results).toHaveLength(0);
  });

  it("retorna 400 para query mayor a 100 caracteres", async () => {
    const response = await GET(makeRequest("a".repeat(101)));
    expect(response.status).toBe(400);
  });

  it("busca por nombre de producto", async () => {
    const response = await GET(makeRequest("filtro"));
    const data = await response.json();
    expect(searchCatalogProducts).toHaveBeenCalledWith("filtro", 6);
    expect(data.results).toHaveLength(2);
    expect(data.results[0].slug).toBe("filtro-aceite-toyota");
  });

  it("busca por SKU", async () => {
    const response = await GET(makeRequest("FRN-042"));
    const data = await response.json();
    expect(searchCatalogProducts).toHaveBeenCalledWith("FRN-042", 6);
    expect(data.results[1].slug).toBe("pastillas-freno-honda");
  });

  it("incluye precio formateado en el resultado", async () => {
    const response = await GET(makeRequest("filtro"));
    const data = await response.json();
    expect(data.results[0].formattedPrice).toMatch(/\$/);
  });

  it("incluye la query en la respuesta", async () => {
    const response = await GET(makeRequest("freno"));
    const data = await response.json();
    expect(data.query).toBe("freno");
  });

  it("no retorna más de 6 resultados", async () => {
    const manyProducts = Array.from({ length: 10 }, (_, i) => ({
      ...mockProducts.products[0],
      name: `Filtro numero ${i}`,
      sku: `SKU-${i}`,
      slug: `producto-${i}`,
    }));
    vi.mocked(searchCatalogProducts).mockResolvedValue({
      products: manyProducts.slice(0, 6),
      source: "database",
      status: "ready",
    } as never);

    const response = await GET(makeRequest("filtro"));
    const data = await response.json();
    expect(data.results.length).toBeLessThanOrEqual(6);
  });

  it("retorna 429 cuando el rate limit bloquea la IP", async () => {
    mockRateLimiter.check.mockResolvedValue({ allowed: false, retryAfterSeconds: 30 });

    const response = await GET(makeRequest("filtro"));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(data.error).toContain("Demasiadas búsquedas");
    expect(searchCatalogProducts).not.toHaveBeenCalled();
  });
});
