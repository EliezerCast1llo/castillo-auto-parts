export type MockProduct = {
  name: string;
  brand: string;
  sku: string;
  partNumber: string;
  compatibility: string;
  priceCents: number;
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
    name: "Filtro de aceite para Toyota 1.8L",
    brand: "WIX",
    sku: "MOCK-FIL-TOY-18",
    partNumber: "WL-T18",
    compatibility: "Corolla 2009-2022 · Yaris 2007-2020",
    priceCents: 895,
    stockStatus: "En stock",
  },
  {
    name: "Pastillas delanteras Nissan Sentra",
    brand: "Akebono",
    sku: "MOCK-BRK-SEN-F",
    partNumber: "PAD-NS-F",
    compatibility: "Sentra 2013-2022",
    priceCents: 3495,
    stockStatus: "Bajo stock",
  },
  {
    name: "Bujia iridio Hyundai/Kia 1.6L",
    brand: "NGK",
    sku: "MOCK-SPK-HK-16",
    partNumber: "IR-HK16",
    compatibility: "Accent · Rio · Forte · Soul",
    priceCents: 1195,
    stockStatus: "En stock",
  },
  {
    name: "Escobilla universal 22 pulgadas",
    brand: "Bosch",
    sku: "MOCK-WIP-22",
    partNumber: "WIP-22",
    compatibility: "Universal por medida",
    priceCents: 750,
    stockStatus: "En stock",
  },
  {
    name: "Filtro de cabina Nissan Rogue",
    brand: "Denso",
    sku: "MOCK-CAB-ROG",
    partNumber: "CAB-NR",
    compatibility: "Rogue 2014-2022",
    priceCents: 1295,
    stockStatus: "Preorder",
  },
  {
    name: "Refrigerante premix 1 galon",
    brand: "Prestone",
    sku: "MOCK-FLD-COOL",
    partNumber: "COOL-PM",
    compatibility: "Uso segun especificacion del fabricante",
    priceCents: 1095,
    stockStatus: "En stock",
  },
];

