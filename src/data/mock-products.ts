export type CatalogVehicleCompatibility = {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  engine?: string;
  notes?: string;
};

export type MockProduct = {
  slug: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  partNumber: string;
  compatibility: string;
  compatibleVehicles: string[];
  vehicleCompatibilities: CatalogVehicleCompatibility[];
  description: string;
  technicalDetails: string[];
  priceCents: number;
  stockQuantity: number;
  stockStatus: "Disponible" | "Últimas unidades" | "No disponible";
  /** URL de la imagen principal. Null para productos sin imagen (mock). */
  primaryImageUrl: string | null;
  /** Todas las imágenes del producto ordenadas por sortOrder. */
  images: { id: string; url: string; alt: string }[];
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
  // -----------------------------------------------------------------------
  // FILTROS
  // -----------------------------------------------------------------------
  {
    slug: "filtro-aceite-toyota-18l",
    name: "Filtro de aceite para Toyota 1.8L",
    category: "Filtros",
    brand: "WIX",
    sku: "MOCK-FIL-TOY-18",
    partNumber: "WL-T18",
    compatibility: "Corolla 2009-2022 · Yaris 2007-2020",
    compatibleVehicles: ["Toyota Corolla 2009-2022", "Toyota Yaris 2007-2020"],
    vehicleCompatibilities: [
      { make: "Toyota", model: "Corolla", yearFrom: 2009, yearTo: 2022 },
      { make: "Toyota", model: "Yaris", yearFrom: 2007, yearTo: 2020 },
    ],
    description:
      "Filtro de aceite para mantenimiento preventivo en motores Toyota 1.8L y aplicaciones compatibles por catálogo.",
    technicalDetails: ["Rosca y empaque según especificación", "Uso con aceite recomendado por fabricante"],
    priceCents: 895,
    stockQuantity: 8,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "filtro-aceite-honda-civic-15t",
    name: "Filtro de aceite Honda Civic 1.5L Turbo",
    category: "Filtros",
    brand: "Denso",
    sku: "MOCK-FIL-CIV-15T",
    partNumber: "DO-1032",
    compatibility: "Civic 2016-2023",
    compatibleVehicles: ["Honda Civic 2016-2023"],
    vehicleCompatibilities: [
      { make: "Honda", model: "Civic", yearFrom: 2016, yearTo: 2023 },
    ],
    description:
      "Filtro de aceite OEM equivalente para Honda Civic 1.5L Turbo. Compatible con aceites 0W-20 y 5W-30 sintéticos.",
    technicalDetails: ["Rosca M20x1.5", "Altura 70 mm", "Diámetro 63 mm", "Presión de bypass 12 psi"],
    priceCents: 995,
    stockQuantity: 6,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "filtro-aire-toyota-hilux-28d",
    name: "Filtro de aire Toyota Hilux 2.8L Diesel",
    category: "Filtros",
    brand: "WIX",
    sku: "MOCK-AIR-HIL-28D",
    partNumber: "WA-H28",
    compatibility: "Hilux 2015-2023",
    compatibleVehicles: ["Toyota Hilux 2015-2023"],
    vehicleCompatibilities: [
      { make: "Toyota", model: "Hilux", yearFrom: 2015, yearTo: 2023 },
    ],
    description:
      "Filtro de aire de alta capacidad para Toyota Hilux 2.8L Diesel. Mantiene el motor limpio en condiciones de polvo y trabajo pesado.",
    technicalDetails: ["Panel plano", "Papel filtrante de alta eficiencia", "Reemplazar cada 15,000 km en ciudad"],
    priceCents: 1850,
    stockQuantity: 4,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "filtro-combustible-nissan-frontier",
    name: "Filtro de combustible Nissan Frontier",
    category: "Filtros",
    brand: "Bosch",
    sku: "MOCK-FUL-FRO",
    partNumber: "F026402808",
    compatibility: "Frontier 2005-2021",
    compatibleVehicles: ["Nissan Frontier 2005-2021"],
    vehicleCompatibilities: [
      { make: "Nissan", model: "Frontier", yearFrom: 2005, yearTo: 2021 },
    ],
    description:
      "Filtro de combustible en línea para Nissan Frontier. Retiene partículas y agua antes de llegar al inyector.",
    technicalDetails: ["Presión de trabajo hasta 65 psi", "Conexiones de ¼\"", "Reemplazar cada 30,000 km"],
    priceCents: 1395,
    stockQuantity: 5,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "filtro-cabina-hyundai-elantra",
    name: "Filtro de cabina Hyundai Elantra",
    category: "Filtros",
    brand: "Denso",
    sku: "MOCK-CAB-ELA",
    partNumber: "CAB-HE",
    compatibility: "Elantra 2017-2023",
    compatibleVehicles: ["Hyundai Elantra 2017-2023"],
    vehicleCompatibilities: [
      { make: "Hyundai", model: "Elantra", yearFrom: 2017, yearTo: 2023 },
    ],
    description:
      "Filtro de habitáculo para Hyundai Elantra. Elimina polvo, alérgenos y partículas del aire que entra al interior.",
    technicalDetails: ["Doble capa carbón activado", "Medida 235x190x30 mm", "Reemplazar cada 20,000 km"],
    priceCents: 1150,
    stockQuantity: 9,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "filtro-aceite-mitsubishi-mirage",
    name: "Filtro de aceite Mitsubishi Mirage",
    category: "Filtros",
    brand: "WIX",
    sku: "MOCK-FIL-MIR-12",
    partNumber: "WL-M12",
    compatibility: "Mirage 2013-2023",
    compatibleVehicles: ["Mitsubishi Mirage 2013-2023"],
    vehicleCompatibilities: [
      { make: "Mitsubishi", model: "Mirage", yearFrom: 2013, yearTo: 2023 },
    ],
    description:
      "Filtro de aceite para Mitsubishi Mirage 1.2L. Compatible con aceites sintéticos y semisintéticos recomendados.",
    technicalDetails: ["Rosca M20x1.5", "Construcción anti-drenaje", "Reemplazar cada 5,000 km"],
    priceCents: 795,
    stockQuantity: 12,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "filtro-aceite-nissan-versa-16",
    name: "Filtro de aceite Nissan Versa 1.6L",
    category: "Filtros",
    brand: "Bosch",
    sku: "MOCK-FIL-VER-16",
    partNumber: "F026407022",
    compatibility: "Versa 2012-2023",
    compatibleVehicles: ["Nissan Versa 2012-2023"],
    vehicleCompatibilities: [
      { make: "Nissan", model: "Versa", yearFrom: 2012, yearTo: 2023 },
    ],
    description:
      "Filtro de aceite de alta eficiencia para Nissan Versa 1.6L. Retiene partículas metálicas y prolonga la vida del motor.",
    technicalDetails: ["Filtro tipo cartucho", "Presión de bypass 13 psi", "Con empaque de caucho incluido"],
    priceCents: 895,
    stockQuantity: 10,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },

  // -----------------------------------------------------------------------
  // FRENOS
  // -----------------------------------------------------------------------
  {
    slug: "pastillas-delanteras-nissan-sentra",
    name: "Pastillas delanteras Nissan Sentra",
    category: "Frenos",
    brand: "Akebono",
    sku: "MOCK-BRK-SEN-F",
    partNumber: "PAD-NS-F",
    compatibility: "Sentra 2013-2022",
    compatibleVehicles: ["Nissan Sentra 2013-2022"],
    vehicleCompatibilities: [
      { make: "Nissan", model: "Sentra", yearFrom: 2013, yearTo: 2022 },
    ],
    description:
      "Juego de pastillas delanteras para Nissan Sentra. Validar versión y sistema de frenos antes de compra.",
    technicalDetails: ["Eje delantero", "Juego por par", "Validar por VIN si hay duda de versión"],
    priceCents: 3495,
    stockQuantity: 2,
    stockStatus: "Últimas unidades",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "pastillas-traseras-nissan-sentra",
    name: "Pastillas traseras Nissan Sentra",
    category: "Frenos",
    brand: "Akebono",
    sku: "MOCK-BRK-SEN-R",
    partNumber: "PAD-NS-R",
    compatibility: "Sentra 2013-2022",
    compatibleVehicles: ["Nissan Sentra 2013-2022"],
    vehicleCompatibilities: [
      { make: "Nissan", model: "Sentra", yearFrom: 2013, yearTo: 2022 },
    ],
    description:
      "Juego de pastillas traseras para Nissan Sentra. Validar si el eje trasero tiene freno de disco o tambor antes de comprar.",
    technicalDetails: ["Eje trasero", "Juego por par", "Bajo nivel de polvo en llanta"],
    priceCents: 2995,
    stockQuantity: 3,
    stockStatus: "Últimas unidades",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "disco-freno-delantero-toyota-corolla",
    name: "Disco de freno delantero Toyota Corolla",
    category: "Frenos",
    brand: "Brembo",
    sku: "MOCK-DSC-COR-F",
    partNumber: "09.A393.11",
    compatibility: "Corolla 2014-2022",
    compatibleVehicles: ["Toyota Corolla 2014-2022"],
    vehicleCompatibilities: [
      { make: "Toyota", model: "Corolla", yearFrom: 2014, yearTo: 2022 },
    ],
    description:
      "Disco de freno delantero ventilado para Toyota Corolla. Fabricado en hierro fundido de alta resistencia al calor.",
    technicalDetails: ["Diámetro 277 mm", "Espesor 24 mm", "Ventilado", "Unidad por pieza"],
    priceCents: 5995,
    stockQuantity: 4,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "pastillas-delanteras-honda-civic",
    name: "Pastillas delanteras Honda Civic",
    category: "Frenos",
    brand: "Akebono",
    sku: "MOCK-BRK-CIV-F",
    partNumber: "PAD-HC-F",
    compatibility: "Civic 2016-2023",
    compatibleVehicles: ["Honda Civic 2016-2023"],
    vehicleCompatibilities: [
      { make: "Honda", model: "Civic", yearFrom: 2016, yearTo: 2023 },
    ],
    description:
      "Pastillas delanteras para Honda Civic. Formulación cerámica de baja polución y buen rendimiento en temperatura.",
    technicalDetails: ["Eje delantero", "Cerámica de bajo polvo", "Con indicador de desgaste"],
    priceCents: 3795,
    stockQuantity: 6,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "pastillas-delanteras-hyundai-elantra",
    name: "Pastillas delanteras Hyundai Elantra",
    category: "Frenos",
    brand: "Bosch",
    sku: "MOCK-BRK-ELA-F",
    partNumber: "BP1438",
    compatibility: "Elantra 2017-2023",
    compatibleVehicles: ["Hyundai Elantra 2017-2023"],
    vehicleCompatibilities: [
      { make: "Hyundai", model: "Elantra", yearFrom: 2017, yearTo: 2023 },
    ],
    description:
      "Pastillas de freno delanteras para Hyundai Elantra. Tecnología QuietCast para operación silenciosa.",
    technicalDetails: ["Eje delantero", "Recubrimiento anti-ruido", "Con arandelas de montaje"],
    priceCents: 3295,
    stockQuantity: 5,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "pastillas-delanteras-kia-forte",
    name: "Pastillas delanteras Kia Forte",
    category: "Frenos",
    brand: "Brembo",
    sku: "MOCK-BRK-FOR-F",
    partNumber: "P30082",
    compatibility: "Forte 2014-2022",
    compatibleVehicles: ["Kia Forte 2014-2022"],
    vehicleCompatibilities: [
      { make: "Kia", model: "Forte", yearFrom: 2014, yearTo: 2022 },
    ],
    description:
      "Pastillas delanteras Brembo OE para Kia Forte. Misma especificación que equipamiento de fábrica.",
    technicalDetails: ["Eje delantero", "Formulación OE equivalente", "Par de pastillas"],
    priceCents: 4195,
    stockQuantity: 2,
    stockStatus: "Últimas unidades",
    primaryImageUrl: null,
    images: [],
  },

  // -----------------------------------------------------------------------
  // BUJÍAS
  // -----------------------------------------------------------------------
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
    vehicleCompatibilities: [
      { make: "Hyundai", model: "Accent", yearFrom: 2012, yearTo: 2022 },
      { make: "Kia", model: "Rio", yearFrom: 2012, yearTo: 2022 },
      { make: "Kia", model: "Forte", yearFrom: 2014, yearTo: 2022 },
      { make: "Kia", model: "Soul", yearFrom: 2010, yearTo: 2022 },
    ],
    description:
      "Bujía de iridio para motores Hyundai/Kia 1.6L compatibles. Confirmar motor MPI/GDI antes de compra.",
    technicalDetails: ["Electrodo de iridio", "Venta por unidad", "Validar calibración según motor"],
    priceCents: 1195,
    stockQuantity: 12,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "bujia-iridio-honda-civic-15t",
    name: "Bujía iridio Honda Civic 1.5L Turbo",
    category: "Bujías",
    brand: "NGK",
    sku: "MOCK-SPK-CIV-15T",
    partNumber: "ILZKAR7B11",
    compatibility: "Civic 1.5T 2016-2023",
    compatibleVehicles: ["Honda Civic 2016-2023"],
    vehicleCompatibilities: [
      { make: "Honda", model: "Civic", yearFrom: 2016, yearTo: 2023 },
    ],
    description:
      "Bujía de iridio láser NGK para Honda Civic 1.5L Turbo. Requiere torque exacto por especificación de motor turbo.",
    technicalDetails: ["Iridio láser", "Electrodo fino 0.6 mm", "Venta por unidad", "Set de 4 para reemplazo completo"],
    priceCents: 1595,
    stockQuantity: 16,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "bujia-platino-toyota-corolla-18",
    name: "Bujía platino Toyota Corolla 1.8L",
    category: "Bujías",
    brand: "Denso",
    sku: "MOCK-SPK-COR-18",
    partNumber: "PK20R11",
    compatibility: "Corolla 2009-2022 · Yaris 2007-2020",
    compatibleVehicles: ["Toyota Corolla 2009-2022", "Toyota Yaris 2007-2020"],
    vehicleCompatibilities: [
      { make: "Toyota", model: "Corolla", yearFrom: 2009, yearTo: 2022 },
      { make: "Toyota", model: "Yaris", yearFrom: 2007, yearTo: 2020 },
    ],
    description:
      "Bujía Denso de platino para Toyota Corolla 1.8L. Larga duración y arranque confiable en clima húmedo.",
    technicalDetails: ["Electrodo de platino", "Resistencia interna 5 kΩ", "Venta por unidad"],
    priceCents: 995,
    stockQuantity: 20,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "bujia-iridio-nissan-versa-16",
    name: "Bujía iridio Nissan Versa 1.6L",
    category: "Bujías",
    brand: "NGK",
    sku: "MOCK-SPK-VER-16",
    partNumber: "ILZKR7B",
    compatibility: "Versa 2012-2023",
    compatibleVehicles: ["Nissan Versa 2012-2023"],
    vehicleCompatibilities: [
      { make: "Nissan", model: "Versa", yearFrom: 2012, yearTo: 2023 },
    ],
    description:
      "Bujía de iridio para Nissan Versa 1.6L. Alta durabilidad y bajo consumo de combustible comparado con bujía estándar.",
    technicalDetails: ["Iridio fino 0.6 mm", "Reemplazar cada 60,000 km", "Venta por unidad"],
    priceCents: 1095,
    stockQuantity: 14,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "bujia-doble-platino-toyota-tacoma",
    name: "Bujía doble platino Toyota Tacoma",
    category: "Bujías",
    brand: "Bosch",
    sku: "MOCK-SPK-TAC-40",
    partNumber: "FR7DC",
    compatibility: "Tacoma 4.0L V6 2005-2022",
    compatibleVehicles: ["Toyota Tacoma 2005-2022"],
    vehicleCompatibilities: [
      { make: "Toyota", model: "Tacoma", yearFrom: 2005, yearTo: 2022 },
    ],
    description:
      "Bujía doble platino Bosch para Toyota Tacoma V6 4.0L. Excelente rendimiento bajo carga y condiciones de trabajo pesado.",
    technicalDetails: ["Platino en electrodo central y lateral", "Resistencia 5 kΩ", "Venta por unidad"],
    priceCents: 1250,
    stockQuantity: 8,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },

  // -----------------------------------------------------------------------
  // ESCOBILLAS
  // -----------------------------------------------------------------------
  {
    slug: "escobilla-universal-22-pulgadas",
    name: "Escobilla universal 22 pulgadas",
    category: "Escobillas",
    brand: "Bosch",
    sku: "MOCK-WIP-22",
    partNumber: "WIP-22",
    compatibility: "Universal por medida",
    compatibleVehicles: ["Universal por medida 22 pulgadas"],
    vehicleCompatibilities: [],
    description:
      "Escobilla universal de 22 pulgadas para reemplazo rápido. Validar medida del lado conductor/pasajero.",
    technicalDetails: ["Medida 22 pulgadas", "Incluye adaptadores comunes", "Venta por unidad"],
    priceCents: 750,
    stockQuantity: 18,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "escobilla-universal-18-pulgadas",
    name: "Escobilla universal 18 pulgadas",
    category: "Escobillas",
    brand: "Bosch",
    sku: "MOCK-WIP-18",
    partNumber: "WIP-18",
    compatibility: "Universal por medida",
    compatibleVehicles: ["Universal por medida 18 pulgadas"],
    vehicleCompatibilities: [],
    description:
      "Escobilla universal de 18 pulgadas. Frecuente para lado pasajero en sedanes medianos. Validar medida exacta.",
    technicalDetails: ["Medida 18 pulgadas", "Incluye adaptadores comunes", "Venta por unidad"],
    priceCents: 695,
    stockQuantity: 22,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "escobilla-universal-26-pulgadas",
    name: "Escobilla universal 26 pulgadas",
    category: "Escobillas",
    brand: "Bosch",
    sku: "MOCK-WIP-26",
    partNumber: "WIP-26",
    compatibility: "Universal por medida",
    compatibleVehicles: ["Universal por medida 26 pulgadas"],
    vehicleCompatibilities: [],
    description:
      "Escobilla universal de 26 pulgadas. Tamaño conductor frecuente en SUVs y pickups. Validar medida exacta.",
    technicalDetails: ["Medida 26 pulgadas", "Marco de acero galvanizado", "Venta por unidad"],
    priceCents: 850,
    stockQuantity: 15,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "kit-escobillas-hyundai-accent",
    name: "Kit de escobillas Hyundai Accent",
    category: "Escobillas",
    brand: "Denso",
    sku: "MOCK-WIP-ACC-KIT",
    partNumber: "WIP-HA-KIT",
    compatibility: "Accent 2012-2023",
    compatibleVehicles: ["Hyundai Accent 2012-2023"],
    vehicleCompatibilities: [
      { make: "Hyundai", model: "Accent", yearFrom: 2012, yearTo: 2023 },
    ],
    description:
      "Kit completo de escobillas conductor y pasajero para Hyundai Accent. Instalación directa sin adaptadores.",
    technicalDetails: ["Conductor 24\", Pasajero 14\"", "Conexión J-hook", "Kit por par"],
    priceCents: 1495,
    stockQuantity: 7,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "kit-escobillas-toyota-hilux",
    name: "Kit de escobillas Toyota Hilux",
    category: "Escobillas",
    brand: "Bosch",
    sku: "MOCK-WIP-HIL-KIT",
    partNumber: "WIP-TH-KIT",
    compatibility: "Hilux 2015-2023",
    compatibleVehicles: ["Toyota Hilux 2015-2023"],
    vehicleCompatibilities: [
      { make: "Toyota", model: "Hilux", yearFrom: 2015, yearTo: 2023 },
    ],
    description:
      "Kit de escobillas aerodinámicas para Toyota Hilux. Diseño sin marco para mejorar el contacto en lluvias fuertes.",
    technicalDetails: ["Conductor 24\", Pasajero 18\"", "Diseño aerodinámico sin marco", "Kit por par"],
    priceCents: 1795,
    stockQuantity: 6,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },

  // -----------------------------------------------------------------------
  // FOCOS
  // -----------------------------------------------------------------------
  {
    slug: "foco-h4-60-55w-halogeno",
    name: "Foco H4 60/55W halógeno",
    category: "Focos",
    brand: "Osram",
    sku: "MOCK-LMP-H4",
    partNumber: "64193",
    compatibility: "Universal H4",
    compatibleVehicles: ["Universal casquillo H4"],
    vehicleCompatibilities: [],
    description:
      "Foco halógeno H4 bi-filamento 60/55W. Válido para vehículos con óptica H4 de reflector. Verificar casquillo antes de comprar.",
    technicalDetails: ["Potencia 60W alta / 55W baja", "Temperatura de color 3200K", "Vida útil 450 h", "Venta por unidad"],
    priceCents: 495,
    stockQuantity: 30,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "foco-h7-55w-halogeno",
    name: "Foco H7 55W halógeno",
    category: "Focos",
    brand: "Osram",
    sku: "MOCK-LMP-H7",
    partNumber: "64210",
    compatibility: "Universal H7",
    compatibleVehicles: ["Universal casquillo H7"],
    vehicleCompatibilities: [],
    description:
      "Foco halógeno H7 55W mono-filamento. Frecuente en vehículos europeos y asiáticos modernos. Confirmar casquillo.",
    technicalDetails: ["Potencia 55W", "Temperatura de color 3200K", "Casquillo PX26d", "Venta por unidad"],
    priceCents: 450,
    stockQuantity: 25,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "foco-led-interior-festoon-31mm",
    name: "Foco LED interior festoon 31 mm",
    category: "Focos",
    brand: "Philips",
    sku: "MOCK-LMP-INT-31",
    partNumber: "12816LED",
    compatibility: "Universal festoon 31 mm",
    compatibleVehicles: ["Universal casquillo festoon 31 mm"],
    vehicleCompatibilities: [],
    description:
      "Foco LED de habitáculo tipo festoon 31 mm. Luz blanca 6000K. Reemplaza focos incandescentes de mapa/cortesía.",
    technicalDetails: ["LED 6000K blanco frío", "Medida 31 mm", "Sin calor excesivo", "Venta por unidad"],
    priceCents: 395,
    stockQuantity: 40,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "foco-stop-1157-ambar",
    name: "Foco de stop 1157 ámbar",
    category: "Focos",
    brand: "Philips",
    sku: "MOCK-LMP-1157-AMB",
    partNumber: "12499LLECOB2",
    compatibility: "Universal 1157",
    compatibleVehicles: ["Universal casquillo 1157 BAY15d"],
    vehicleCompatibilities: [],
    description:
      "Foco ámbar 1157 para luz de stop y direccional. Doble filamento para función de freno y parking simultáneos.",
    technicalDetails: ["Doble filamento 21/5W", "Ámbar ámbar", "Casquillo BAY15d", "Venta por par"],
    priceCents: 350,
    stockQuantity: 35,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "foco-h11-55w-halogeno",
    name: "Foco H11 55W halógeno",
    category: "Focos",
    brand: "Osram",
    sku: "MOCK-LMP-H11",
    partNumber: "64211",
    compatibility: "Universal H11",
    compatibleVehicles: ["Universal casquillo H11"],
    vehicleCompatibilities: [],
    description:
      "Foco H11 para luz de cruce y antiniebla. Compatible con la mayoría de vehículos modernos que usan casquillo H11.",
    technicalDetails: ["Potencia 55W", "Casquillo PGJ19-2", "Sin protector UV", "Venta por unidad"],
    priceCents: 475,
    stockQuantity: 0,
    stockStatus: "No disponible",
    primaryImageUrl: null,
    images: [],
  },

  // -----------------------------------------------------------------------
  // FLUIDOS
  // -----------------------------------------------------------------------
  {
    slug: "filtro-cabina-nissan-rogue",
    name: "Filtro de cabina Nissan Rogue",
    category: "Filtros",
    brand: "Denso",
    sku: "MOCK-CAB-ROG",
    partNumber: "CAB-NR",
    compatibility: "Rogue 2014-2022",
    compatibleVehicles: ["Nissan Rogue 2014-2022"],
    vehicleCompatibilities: [
      { make: "Nissan", model: "Rogue", yearFrom: 2014, yearTo: 2022 },
    ],
    description:
      "Filtro de cabina para Nissan Rogue. Producto marcado como no disponible mientras se valida inventario real.",
    technicalDetails: ["Filtro de habitáculo", "Validar generación y origen", "No disponible/consultar disponibilidad"],
    priceCents: 1295,
    stockQuantity: 0,
    stockStatus: "No disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "aceite-5w30-sintetico-1qt",
    name: "Aceite 5W-30 sintético 1 qt",
    category: "Fluidos",
    brand: "Mobil",
    sku: "MOCK-OIL-5W30-1Q",
    partNumber: "MOB-5W30-QT",
    compatibility: "Uso según especificación del fabricante",
    compatibleVehicles: ["Universal según especificación del fabricante"],
    vehicleCompatibilities: [],
    description:
      "Aceite de motor sintético 5W-30 Mobil 1. Ideal para motores de última generación con alta exigencia térmica.",
    technicalDetails: ["Viscosidad 5W-30", "Totalmente sintético", "API SP / ILSAC GF-6A", "Presentación 1 qt (946 ml)"],
    priceCents: 1695,
    stockQuantity: 25,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "aceite-10w40-semi-sintetico-1qt",
    name: "Aceite 10W-40 semisintético 1 qt",
    category: "Fluidos",
    brand: "Castrol",
    sku: "MOCK-OIL-10W40-1Q",
    partNumber: "CST-10W40-QT",
    compatibility: "Uso según especificación del fabricante",
    compatibleVehicles: ["Universal según especificación del fabricante"],
    vehicleCompatibilities: [],
    description:
      "Aceite semisintético 10W-40 para motores con mayor kilometraje. Buena protección contra desgaste en clima cálido.",
    technicalDetails: ["Viscosidad 10W-40", "Semisintético", "API SN Plus", "Presentación 1 qt (946 ml)"],
    priceCents: 1295,
    stockQuantity: 20,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "liquido-frenos-dot4-500ml",
    name: "Líquido de frenos DOT 4 500 ml",
    category: "Fluidos",
    brand: "Bosch",
    sku: "MOCK-FLD-DOT4",
    partNumber: "BO-DOT4",
    compatibility: "Uso según especificación del fabricante",
    compatibleVehicles: ["Universal según especificación del fabricante"],
    vehicleCompatibilities: [],
    description:
      "Líquido de frenos DOT 4 de alta temperatura. Compatible con sistemas de freno ABS. Reemplazar cada 2 años o según manual.",
    technicalDetails: ["Norma DOT 4", "Punto de ebullición seco 260 °C", "Punto húmedo 165 °C", "Presentación 500 ml"],
    priceCents: 895,
    stockQuantity: 18,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "aceite-atf-caja-automatica-1qt",
    name: "Aceite ATF caja automática 1 qt",
    category: "Fluidos",
    brand: "Mobil",
    sku: "MOCK-ATF-1Q",
    partNumber: "MOB-ATF-QT",
    compatibility: "Uso según especificación del fabricante",
    compatibleVehicles: ["Universal según especificación del fabricante"],
    vehicleCompatibilities: [],
    description:
      "Aceite ATF para caja de cambios automática. Confirmar especificación (Dexron III, ATF+4, CVT, etc.) según manual del vehículo.",
    technicalDetails: ["Multi-formulación", "Dexron III / Mercon compatible", "Presentación 1 qt", "No mezclar especificaciones"],
    priceCents: 1495,
    stockQuantity: 12,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
  },
  {
    slug: "liquido-refrigerante-concentrado-1lt",
    name: "Líquido refrigerante concentrado 1 L",
    category: "Fluidos",
    brand: "Prestone",
    sku: "MOCK-FLD-COOL-C",
    partNumber: "COOL-C1L",
    compatibility: "Uso según especificación del fabricante",
    compatibleVehicles: ["Universal según especificación del fabricante"],
    vehicleCompatibilities: [],
    description:
      "Refrigerante concentrado. Diluir 50% con agua destilada. Protege contra herrumbre, ebullición y congelamiento.",
    technicalDetails: ["Concentrado (diluir 50/50)", "Verde universal", "Compatible con aluminio", "Presentación 1 litro"],
    priceCents: 1195,
    stockQuantity: 8,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
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
    vehicleCompatibilities: [],
    description:
      "Refrigerante premix listo para uso. Confirmar especificación requerida por el fabricante del vehículo.",
    technicalDetails: ["Presentación 1 galón", "Premix listo para uso", "No mezclar con fórmulas incompatibles"],
    priceCents: 1095,
    stockQuantity: 10,
    stockStatus: "Disponible",
    primaryImageUrl: null,
    images: [],
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
