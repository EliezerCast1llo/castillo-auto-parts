"use client";

import { CompatibilityBadge } from "./compatibility-badge";
import { formatMyVehicle, type MyVehicle } from "@/lib/my-vehicle";
import { useMyVehicle } from "@/components/use-my-vehicle";

type Compatibility = {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
};

/**
 * Badge "Compatible con tu <vehículo>" contra la cookie "mi vehículo".
 * Client-side a propósito: leer la cookie aquí no vuelve dinámicas las
 * páginas de producto cacheadas. Sin cookie no renderiza nada.
 */
export function MyVehicleCompatibility({ compatibilities }: { compatibilities: Compatibility[] }) {
  const vehicle = useMyVehicle();

  if (!vehicle) return null;

  return (
    <CompatibilityBadge
      isCompatible={isCompatibleWith(vehicle, compatibilities)}
      vehicleLabel={formatMyVehicle(vehicle)}
    />
  );
}

function isCompatibleWith(vehicle: MyVehicle, compatibilities: Compatibility[]) {
  const year = vehicle.year ? Number(vehicle.year) : null;

  return compatibilities.some((compatibility) => {
    if (!equalsInsensitive(compatibility.make, vehicle.make)) return false;
    if (vehicle.model && !equalsInsensitive(compatibility.model, vehicle.model)) return false;
    if (year !== null && (year < compatibility.yearFrom || year > compatibility.yearTo)) return false;

    return true;
  });
}

function equalsInsensitive(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
