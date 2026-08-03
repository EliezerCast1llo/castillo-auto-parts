/**
 * "Mi vehículo": persistencia de la selección marca/modelo/año del cliente.
 *
 * Se guarda en una cookie NO httpOnly (no es dato sensible) para poder
 * leerla tanto en el servidor (pre-aplicar el filtro del catálogo en SSR)
 * como en el cliente (badge de compatibilidad en cards/PDP sin volver
 * dinámicas las páginas cacheadas).
 *
 * Helpers puros e isomorfos: la lectura server-side vive en
 * `my-vehicle-server.ts` (usa next/headers).
 */

export const MY_VEHICLE_COOKIE = "castillo_my_vehicle";

const MY_VEHICLE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
const MAX_FIELD_LENGTH = 60;

export type MyVehicle = {
  make: string;
  model?: string;
  year?: string;
};

export function parseMyVehicleCookie(value: string | undefined): MyVehicle | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    if (typeof parsed !== "object" || parsed === null) return null;

    const make = readField(parsed, "make");
    if (!make) return null;

    const model = readField(parsed, "model");
    const year = readField(parsed, "year");

    return {
      make,
      ...(model ? { model } : {}),
      ...(year && /^\d{4}$/.test(year) ? { year } : {}),
    };
  } catch {
    return null;
  }
}

export function serializeMyVehicle(vehicle: MyVehicle) {
  return encodeURIComponent(
    JSON.stringify({
      make: vehicle.make,
      ...(vehicle.model ? { model: vehicle.model } : {}),
      ...(vehicle.year ? { year: vehicle.year } : {}),
    }),
  );
}

export function formatMyVehicle(vehicle: MyVehicle) {
  return [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ");
}

// --- helpers client-side (document.cookie) -------------------------------

export function buildMyVehicleSetCookie(vehicle: MyVehicle) {
  return `${MY_VEHICLE_COOKIE}=${serializeMyVehicle(vehicle)}; path=/; max-age=${MY_VEHICLE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function buildMyVehicleClearCookie() {
  return `${MY_VEHICLE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** Lee la cookie desde document.cookie (solo cliente). */
export function readMyVehicleFromDocument(cookieSource: string): MyVehicle | null {
  const entry = cookieSource
    .split("; ")
    .find((item) => item.startsWith(`${MY_VEHICLE_COOKIE}=`));

  return parseMyVehicleCookie(entry?.slice(MY_VEHICLE_COOKIE.length + 1));
}

function readField(source: object, key: string): string {
  const value = (source as Record<string, unknown>)[key];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_FIELD_LENGTH);
}
