"use client";

import { useRouter } from "@/lib/i18n/navigation";
import type { ReactNode } from "react";
import { buildMyVehicleClearCookie, buildMyVehicleSetCookie } from "@/lib/my-vehicle";

type CatalogFilterFormProps = {
  children: ReactNode;
};

export function CatalogFilterForm({ children }: CatalogFilterFormProps) {
  const router = useRouter();

  return (
    <form
      action="/catalog"
      className="space-y-4"
      onChange={(event) => {
        const target = event.target;

        if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
          return;
        }

        if (target.type === "search" || target.name === "q") {
          return;
        }

        event.currentTarget.requestSubmit();
      }}
      onSubmit={(event) => {
        event.preventDefault();

        const params = new URLSearchParams();
        const formData = new FormData(event.currentTarget);

        for (const [key, value] of formData.entries()) {
          const textValue = String(value).trim();

          if (textValue) {
            params.append(key, textValue);
          }
        }

        // Persistir "mi vehículo": si el formulario incluye el selector de
        // vehículo, la selección actual (o su ausencia) manda sobre la cookie.
        if (formData.has("vehicleMake")) {
          const make = String(formData.get("vehicleMake") ?? "").trim();

          document.cookie = make
            ? buildMyVehicleSetCookie({
                make,
                model: String(formData.get("vehicleModel") ?? "").trim() || undefined,
                year: String(formData.get("vehicleYear") ?? "").trim() || undefined,
              })
            : buildMyVehicleClearCookie();
        }

        router.push({ pathname: "/catalog", query: Object.fromEntries(params) }, { scroll: false });
      }}
    >
      {children}
    </form>
  );
}
