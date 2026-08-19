"use client";

import { Link } from "@/lib/i18n/navigation";
import { Car } from "lucide-react";
import { formatMyVehicle } from "@/lib/my-vehicle";
import { useMyVehicle } from "@/components/use-my-vehicle";

/**
 * Chip "Mi vehículo" del header: muestra la selección guardada en cookie y
 * enlaza al catálogo (donde el filtro se pre-aplica). Lee la cookie en el
 * cliente para no volver dinámico el render del header.
 */
export function MyVehicleChip() {
  const vehicle = useMyVehicle();

  if (!vehicle) return null;

  const label = formatMyVehicle(vehicle);

  return (
    <Link
      aria-label={`Ver repuestos para tu vehículo ${label}`}
      className="hidden h-10 max-w-56 items-center gap-2 rounded-xl border border-ca-blue-700/25 bg-ca-blue-700/5 px-3 text-sm font-bold text-ca-navy-950 transition hover:border-ca-blue-700/45 hover:bg-ca-blue-700/10 lg:inline-flex"
      href="/catalog"
      title={`Mi vehículo: ${label}`}
    >
      <Car className="h-4 w-4 shrink-0 text-ca-blue-700" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
