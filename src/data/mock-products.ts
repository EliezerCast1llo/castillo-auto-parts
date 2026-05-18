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
  stockStatus: "Disponible" | "Últimas unidades" | "No disponible";
};

export const vehicleMakes = ["Toyota", "Nissan", "Hyundai", "Kia", "Honda", "Mitsubishi"];

export const mockCategories = [
  "Filtros",
  "Frenos",
  "Bujías",
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
      "Filtro de aceite para mantenimiento preventivo en motores Toyota 1.8L y aplicaciones compatibles por catálogo.",
    technicalDetails: ["Rosca y empaque según especificación", "Uso con aceite recomendado por fabricante"],
    priceCents: 895,
    stockQuantity: 8,
    stockStatus: "Disponible",
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
      "Juego de pastillas delanteras para Nissan Sentra. Validar versión y sistema de frenos antes de compra.",
    technicalDetails: ["Eje delantero", "Juego por par", "Validar por VIN si hay duda de versión"],
    priceCents: 3495,
    stockQuantity: 2,
    stockStatus: "Últimas unidades",
  },
  {
    slug: "bujia-iridio-hyundai-kia-16l",
    name: "Bujía iridio Hyundai/Kia 1.6L",
    category: "Bujías",
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
      "Bujía de iridio para motores Hyundai/Kia 1.6L compatibles. Confirmar motor MPI/GDI antes de compra.",
    technicalDetails: ["Electrodo de iridio", "Venta por unidad", "Validar calibración según motor"],
    priceCents: 1195,
    stockQuantity: 12,
    stockStatus: "Disponible",
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
      "Escobilla universal de 22 pulgadas para reemplazo rápido. Validar medida del lado conductor/pasajero.",
    technicalDetails: ["Medida 22 pulgadas", "Incluye adaptadores comunes", "Venta por unidad"],
    priceCents: 750,
    stockQuantity: 18,
    stockStatus: "Disponible",
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
      "Filtro de cabina para Nissan Rogue. Producto marcado como no disponible mientras se valida inventario real.",
    technicalDetails: ["Filtro de habitáculo", "Validar generación y origen", "No disponible/consultar disponibilidad"],
    priceCents: 1295,
    stockQuantity: 0,
    stockStatus: "No disponible",
  },
  {
    slug: "refrigerante-premix-1-galon",
    name: "Refrigerante premix 1 galón",
    category: "Fluidos",
    brand: "Prestone",
    sku: "MOCK-FLD-COOL",
    partNumber: "COOL-PM",
    compatibility: "Uso según especificación del fabricante",
    compatibleVehicles: ["Universal según especificación del fabricante"],
    description:
      "Refrigerante premix listo para uso. Confirmar especificación requerida por el fabricante del vehículo.",
    technicalDetails: ["Presentación 1 galón", "Premix listo para uso", "No mezclar con fórmulas incompatibles"],
    priceCents: 1095,
    stockQuantity: 10,
    stockStatus: "Disponible",
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
