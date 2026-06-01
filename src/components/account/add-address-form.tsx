"use client";

import { useState } from "react";
import { addAddressAction } from "@/app/account/addresses/actions";
import { CheckoutLocationPicker } from "@/components/checkout/checkout-location-picker";
import type { DeliveryZoneOption } from "@/lib/fulfillment";

export function AddAddressForm({ deliveryZones }: { deliveryZones: DeliveryZoneOption[] }) {
  const [deliveryZoneSlug, setDeliveryZoneSlug] = useState("");
  const selectedZone = deliveryZones.find((z) => z.slug === deliveryZoneSlug);

  return (
    <form action={addAddressAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-ca-navy-950">
            Dirección *
            <input
              className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
              name="addressLine1"
              placeholder="Calle, avenida o pasaje"
              required
              type="text"
            />
          </label>
        </div>
        <label className="block text-sm font-semibold text-ca-navy-950">
          Casa, local o referencia
          <input
            className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
            name="addressLine2"
            type="text"
          />
        </label>
        <label className="block text-sm font-semibold text-ca-navy-950">
          Municipio *
          <select
            className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
            onChange={(e) => setDeliveryZoneSlug(e.target.value)}
            required
            value={deliveryZoneSlug}
          >
            <option value="">Selecciona municipio</option>
            {deliveryZones.map((zone) => (
              <option key={zone.id} value={zone.slug}>
                {zone.name}
              </option>
            ))}
          </select>
          <input type="hidden" name="city" value={selectedZone?.city ?? ""} />
        </label>
        <label className="block text-sm font-semibold text-ca-navy-950">
          Departamento
          <input
            className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm"
            name="department"
            readOnly
            type="text"
            value={selectedZone?.department ?? ""}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-ca-navy-950">
        Notas de entrega
        <textarea
          className="mt-2 min-h-20 w-full rounded-xl border border-ca-border bg-ca-background px-3 py-2 text-sm outline-none focus:border-ca-navy-950"
          name="deliveryNotes"
          placeholder="Indicaciones, horario preferido o referencia del lugar"
        />
      </label>

      <CheckoutLocationPicker />

      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-[0_8px_16px_rgba(6,25,51,0.15)] transition hover:bg-ca-navy-800"
        type="submit"
      >
        Guardar dirección
      </button>
    </form>
  );
}
