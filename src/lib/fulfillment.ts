import { db } from "./db";

export const DEFAULT_LOCATION_CODE = "MAIN";

export type DeliveryZoneOption = {
  city: string;
  department: string;
  feeCents: number;
  id: string;
  isActive: boolean;
  name: string;
  slug: string;
};

type DeliveryZoneCoordinateBounds = {
  maxLatitude: number;
  maxLongitude: number;
  minLatitude: number;
  minLongitude: number;
};

export type PickupLocationOption = {
  address: string;
  code: string;
  latitude?: number;
  longitude?: number;
  mapUrl: string;
  name: string;
  pickupHours: string;
  pickupInstructions: string;
};

export const defaultDeliveryZones: DeliveryZoneOption[] = [
  {
    city: "Santa Tecla",
    department: "La Libertad",
    feeCents: 200,
    id: "fallback-santa-tecla",
    isActive: true,
    name: "Santa Tecla",
    slug: "santa-tecla",
  },
  {
    city: "San Salvador",
    department: "San Salvador",
    feeCents: 300,
    id: "fallback-san-salvador",
    isActive: true,
    name: "San Salvador",
    slug: "san-salvador",
  },
];

export const defaultPickupLocation: PickupLocationOption = {
  address: "Bodega principal, San Salvador, El Salvador",
  code: DEFAULT_LOCATION_CODE,
  latitude: 13.6929,
  longitude: -89.2182,
  mapUrl: buildGoogleMapsEmbedUrl({
    address: "Bodega principal, San Salvador, El Salvador",
    latitude: 13.6929,
    longitude: -89.2182,
  }),
  name: "Bodega principal",
  pickupHours: "Lunes a sábado, 8:00 a. m. a 5:00 p. m.",
  pickupInstructions: "Presenta tu número de orden al llegar a bodega.",
};

export async function getFulfillmentOptions() {
  const [pickupLocation, deliveryZones] = await Promise.all([
    getPickupLocation(),
    getActiveDeliveryZones(),
  ]);

  return {
    deliveryZones,
    pickupLocation,
  };
}

export async function getPickupLocation(): Promise<PickupLocationOption> {
  try {
    const location = await db.inventoryLocation.findFirst({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      where: { isActive: true },
    });

    if (!location) return defaultPickupLocation;

    const address = location.address || defaultPickupLocation.address;
    const latitude = location.latitude === null ? undefined : Number(location.latitude);
    const longitude = location.longitude === null ? undefined : Number(location.longitude);

    return {
      address,
      code: location.code,
      latitude,
      longitude,
      mapUrl: buildGoogleMapsEmbedUrl({ address, latitude, longitude }),
      name: location.name,
      pickupHours: location.pickupHours || defaultPickupLocation.pickupHours,
      pickupInstructions: location.pickupInstructions || defaultPickupLocation.pickupInstructions,
    };
  } catch {
    return defaultPickupLocation;
  }
}

export async function getActiveDeliveryZones(): Promise<DeliveryZoneOption[]> {
  try {
    const zones = await db.deliveryZone.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      where: { isActive: true },
    });

    if (zones.length === 0) return defaultDeliveryZones;

    return zones.map((zone) => ({
      city: zone.city,
      department: zone.department,
      feeCents: zone.feeCents,
      id: zone.id,
      isActive: zone.isActive,
      name: zone.name,
      slug: zone.slug,
    }));
  } catch {
    return defaultDeliveryZones;
  }
}

export function getDeliveryFeeCents(city: string | undefined, zones = defaultDeliveryZones) {
  const normalizedCity = normalizeCoverageValue(city ?? "");
  const zone = zones.find(
    (item) => item.isActive && normalizeCoverageValue(item.city) === normalizedCity,
  );

  return zone?.feeCents ?? null;
}

export function getDeliveryZoneBySlug(
  slug: string | undefined,
  zones = defaultDeliveryZones,
) {
  const normalizedSlug = normalizeCoverageValue(slug ?? "");

  return zones.find(
    (item) => item.isActive && normalizeCoverageValue(item.slug) === normalizedSlug,
  );
}

export function isCoordinateInsideDeliveryZone({
  latitude,
  longitude,
  zone,
}: {
  latitude: number | undefined;
  longitude: number | undefined;
  zone: DeliveryZoneOption;
}) {
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;

  const bounds = deliveryZoneCoordinateBounds[zone.slug];
  if (!bounds) return true;

  return (
    latitude >= bounds.minLatitude &&
    latitude <= bounds.maxLatitude &&
    longitude >= bounds.minLongitude &&
    longitude <= bounds.maxLongitude
  );
}

export function normalizeCoverageValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function buildGoogleMapsEmbedUrl({
  address,
  latitude,
  longitude,
}: {
  address: string;
  latitude?: number;
  longitude?: number;
}) {
  const query =
    typeof latitude === "number" && typeof longitude === "number"
      ? `${latitude},${longitude}`
      : address;

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

const deliveryZoneCoordinateBounds: Record<string, DeliveryZoneCoordinateBounds> = {
  "san-salvador": {
    maxLatitude: 13.76,
    maxLongitude: -89.12,
    minLatitude: 13.62,
    minLongitude: -89.29,
  },
  "santa-tecla": {
    maxLatitude: 13.73,
    maxLongitude: -89.22,
    minLatitude: 13.62,
    minLongitude: -89.37,
  },
};
