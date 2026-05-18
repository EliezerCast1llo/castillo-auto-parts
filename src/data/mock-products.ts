export type MockProduct = {
  slug: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  partNumber: string;
  compatibility: string;
  compatibleVehicles: string[];
  description: string;
  technicalDetails: string[];
  priceCents: number;
  stockQuantity: number;
  stockStatus: "En stock" | "Bajo stock" | "Preorder";
};

export const vehicleMakes = ["Toyota", "Nissan", "Hyundai", "Kia", "Honda", "Mitsubishi"];

export const mockCategories = [
  "Filtros",
  "Frenos",
  "Bujias",
  "Escobillas",
  "Focos",
  "Fluidos",
];

export const mockProducts: MockProduct[] = [
  {
    slug: "filtro-aceite-toyota-18l",
    name: "Filtro de aceite para Toyota 1.8L",
    category: "Filtros",
    brand: "WIX",
    sku: "MOCK-FIL-TOY-18",
    partNumber: "WL-T18",
    compatibility: "Corolla 2009-2022 · Yaris 2007-2020",
    compatibleVehicles: ["Toyota Corolla 2009-2022", "Toyota Yaris 2007-2020"],
    description:
      "Filtro de aceite para mantenimiento preventivo en motores Toyota 1.8L y aplicaciones compatibles por catalogo.",
    technicalDetails: ["Rosca y empaque segun especificacion", "Uso con aceite recomendado por fabricante"],
    priceCents: 895,
    stockQuantity: 8,
    stockStatus: "En stock",
  },
  {
    slug: "pastillas-delanteras-nissan-sentra",
    name: "Pastillas delanteras Nissan Sentra",
    category: "Frenos",
    brand: "Akebono",
    sku: "MOCK-BRK-SEN-F",
    partNumber: "PAD-NS-F",
    compatibility: "Sentra 2013-2022",
    compatibleVehicles: ["Nissan Sentra 2013-2022"],
    description:
      "Juego de pastillas delanteras para Nissan Sentra. Validar version y sistema de frenos antes de compra.",
    technicalDetails: ["Eje delantero", "Juego por par", "Validar por VIN si hay duda de version"],
    priceCents: 3495,
    stockQuantity: 2,
    stockStatus: "Bajo stock",
  },
  {
    slug: "bujia-iridio-hyundai-kia-16l",
    name: "Bujia iridio Hyundai/Kia 1.6L",
    category: "Bujias",
    brand: "NGK",
    sku: "MOCK-SPK-HK-16",
    partNumber: "IR-HK16",
    compatibility: "Accent · Rio · Forte · Soul",
    compatibleVehicles: [
      "Hyundai Accent 2012-2022",
      "Kia Rio 2012-2022",
      "Kia Forte 2014-2022",
      "Kia Soul 2010-2022",
    ],
    description:
      "Bujia de iridio para motores Hyundai/Kia 1.6L compatibles. Confirmar motor MPI/GDI antes de compra.",
    technicalDetails: ["Electrodo de iridio", "Venta por unidad", "Validar calibracion segun motor"],
    priceCents: 1195,
    stockQuantity: 12,
    stockStatus: "En stock",
  },
  {
    slug: "escobilla-universal-22-pulgadas",
    name: "Escobilla universal 22 pulgadas",
    category: "Escobillas",
    brand: "Bosch",
    sku: "MOCK-WIP-22",
    partNumber: "WIP-22",
    compatibility: "Universal por medida",
    compatibleVehicles: ["Universal por medida 22 pulgadas"],
    description:
      "Escobilla universal de 22 pulgadas para reemplazo rapido. Validar medida del lado conductor/pasajero.",
    technicalDetails: ["Medida 22 pulgadas", "Incluye adaptadores comunes", "Venta por unidad"],
    priceCents: 750,
    stockQuantity: 18,
    stockStatus: "En stock",
  },
  {
    slug: "filtro-cabina-nissan-rogue",
    name: "Filtro de cabina Nissan Rogue",
    category: "Filtros",
    brand: "Denso",
    sku: "MOCK-CAB-ROG",
    partNumber: "CAB-NR",
    compatibility: "Rogue 2014-2022",
    compatibleVehicles: ["Nissan Rogue 2014-2022"],
    description:
      "Filtro de cabina para Nissan Rogue. Producto marcado como preorder mientras se valida inventario real.",
    technicalDetails: ["Filtro de habitaculo", "Validar generacion y origen", "Preorder/consultar disponibilidad"],
    priceCents: 1295,
    stockQuantity: 0,
    stockStatus: "Preorder",
  },
  {
    slug: "refrigerante-premix-1-galon",
    name: "Refrigerante premix 1 galon",
    category: "Fluidos",
    brand: "Prestone",
    sku: "MOCK-FLD-COOL",
    partNumber: "COOL-PM",
    compatibility: "Uso segun especificacion del fabricante",
    compatibleVehicles: ["Universal segun especificacion del fabricante"],
    description:
      "Refrigerante premix listo para uso. Confirmar especificacion requerida por el fabricante del vehiculo.",
    technicalDetails: ["Presentacion 1 galon", "Premix listo para uso", "No mezclar con formulas incompatibles"],
    priceCents: 1095,
    stockQuantity: 10,
    stockStatus: "En stock",
  },
];

export function getFeaturedProducts() {
  return mockProducts.slice(0, 6);
}

export function getProductBySlug(slug: string) {
  return mockProducts.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: MockProduct) {
  return mockProducts
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, 3);
}
