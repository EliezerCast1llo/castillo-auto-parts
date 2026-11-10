"use client";

import { Link } from "@/lib/i18n/navigation";
import { useTranslations } from "next-intl";
import { Car } from "lucide-react";
import { formatMyVehicle } from "@/lib/my-vehicle";
import { useMyVehicle } from "@/components/use-my-vehicle";

/**
 * Chip "Mi vehículo" del header: muestra la selección guardada en cookie y
 * enlaza al catálogo (donde el filtro se pre-aplica). Lee la cookie en el
 * cliente para no volver dinámico el render del header.
 */
export function MyVehicleChip() {
  const t = useTranslations("Nav");
  const vehicle = useMyVehicle();

  if (!vehicle) return null;

  const label = formatMyVehicle(vehicle);

  return (
    <Link
      aria-label={t("viewPartsForVehicle", { vehicle: label })}
      className="hidden h-10 max-w-56 items-center gap-2 rounded-ca-control border border-ca-navy-hover/25 bg-ca-navy-hover/5 px-3 text-sm font-bold text-ca-navy transition hover:border-ca-navy-hover/45 hover:bg-ca-navy-hover/10 lg:inline-flex"
      href="/catalog"
      title={t("myVehicle", { vehicle: label })}
    >
      <Car className="h-4 w-4 shrink-0 text-ca-navy-hover" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
