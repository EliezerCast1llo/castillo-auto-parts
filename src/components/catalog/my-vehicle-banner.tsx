"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { Car, X } from "lucide-react";
import { buildMyVehicleClearCookie } from "@/lib/my-vehicle";

/**
 * Aviso de filtro pre-aplicado desde la cookie "mi vehículo".
 * "Quitar" borra la cookie y refresca: una sola acción, sin estados a medias.
 *
 * El aviso se oculta mientras el refresco está en vuelo para responder al
 * instante, pero atado a la transición: si el refresco no llega, el aviso
 * reaparece en vez de dejar el catálogo filtrado sin que nada lo indique.
 */
export function MyVehicleBanner({
  removeFilterLabel,
  vehicleLabel,
}: {
  removeFilterLabel: string;
  vehicleLabel: string;
}) {
  const router = useRouter();
  const [clearing, startClearing] = useTransition();

  if (clearing) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ca-blue-700/20 bg-ca-blue-700/5 px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-bold text-ca-navy-950">
        <Car className="h-4 w-4 shrink-0 text-ca-blue-700" />
        <span>
        Filtrando repuestos para tu vehículo:{" "}
          <span className="font-black">{vehicleLabel}</span>
        </span>
      </p>
      <button
        className="inline-flex items-center gap-1.5 rounded-full border border-ca-border bg-white px-3 py-1.5 text-xs font-black text-ca-navy-950 transition hover:border-ca-border-hover hover:bg-ca-background"
        onClick={() => {
          document.cookie = buildMyVehicleClearCookie();
          startClearing(() => router.refresh());
        }}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
        {removeFilterLabel}
      </button>
    </div>
  );
}
