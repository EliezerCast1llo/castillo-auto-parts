/**
 * Tests unitarios del Route Handler GET /api/search.
 *
 * No testean el componente React (SearchAutocomplete) porque requiere
 * jsdom y setup de testing-library — pendiente si se agrega la config.
 * Se cubren los casos de negocio del endpoint directamente.
 */

import { NextRequest } from "next/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

// Mock de getCatalogProducts para no depender de DB en tests unitarios
vi.mock("@/data/products", () => ({
  getCatalogProducts: vi.fn(),
}));

import { getCatalogProducts } from "@/data/products";

const mockProducts = [
  {
    slug: "filtro-aceite-toyota",
    name: "Filtro de aceite Toyota",
    sku: "FLT-001",
    category: "Filtros",
    brand: "Toyota",
    priceCents: 1500,
    stockStatus: "Disponible",
    compatibility: "Toyota Corolla 2018-2023",
    compatibleVehicles: ["Toyota Corolla 2018-2023"],
    vehicleCompatibilities: [],
    description: "Filtro de aceite original",
    technicalDetails: [],
    partNumber: "90915-YZZF2",
    stockQuantity: 10,
  },
  {
    slug: "pastillas-freno-honda",
    name: "Pastillas de freno Honda",
    sku: "FRN-042",
    category: "Frenos",
    brand: "Honda",
    priceCents: 4500,
    stockStatus: "Últimas unidades",
    compatibility: "Honda Civic 2016-2021",
    compatibleVehicles: ["Honda Civic 2016-2021"],
    vehicleCompatibilities: [],
    description: "Pastillas de freno de alto rendimiento",
    technicalDetails: [],
    partNumber: "45022-TBA-A01",
    stockQuantity: 2,
  },
];

function makeRequest(q: string) {
  return new NextRequest(`http://localhost:3000/api/search?q=${encodeURIComponent(q)}`);
}

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.mocked(getCatalogProducts).mockResolvedValue(mockProducts as never);
  });

  it("retorna array vacío para query menor a 2 caracteres", async () => {
    const response = await GET(makeRequest("f"));
    const data = await response.json();
    expect(data.results).toHaveLength(0);
    expect(response.status).toBe(200);
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
    expect(data.results).toHaveLength(1);
    expect(data.results[0].slug).toBe("filtro-aceite-toyota");
  });

  it("busca por SKU", async () => {
    const response = await GET(makeRequest("FRN-042"));
    const data = await response.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].slug).toBe("pastillas-freno-honda");
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
      ...mockProducts[0],
      slug: `producto-${i}`,
      name: `Filtro numero ${i}`,
      sku: `SKU-${i}`,
    }));
    vi.mocked(getCatalogProducts).mockResolvedValue(manyProducts as never);

    const response = await GET(makeRequest("filtro"));
    const data = await response.json();
    expect(data.results.length).toBeLessThanOrEqual(6);
  });
});
