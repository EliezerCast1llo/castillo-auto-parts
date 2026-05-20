"use client";

import { Info, MapPin } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/money";
import type { FulfillmentMethod } from "@/lib/checkout";
import type { DeliveryZoneOption, PickupLocationOption } from "@/lib/fulfillment";

export function CheckoutDeliveryFields({
  deliveryZones,
  pickupLocation,
  subtotalCents,
}: {
  deliveryZones: DeliveryZoneOption[];
  pickupLocation: PickupLocationOption;
  subtotalCents: number;
}) {
  const [method, setMethod] = useState<FulfillmentMethod>("PICKUP");
  const [city, setCity] = useState("");
  const [department, setDepartment] = useState("");
  const isDelivery = method === "LOCAL_DELIVERY";
  const selectedZone = deliveryZones.find((zone) => zone.city === city);
  const shippingCents = isDelivery ? (selectedZone ? selectedZone.feeCents : null) : 0;
  const totalCents = subtotalCents + (shippingCents ?? 0);

  function selectMethod(nextMethod: FulfillmentMethod) {
    setMethod(nextMethod);
    if (nextMethod === "PICKUP") {
      setCity("");
      setDepartment("");
    }
  }

  function selectCity(nextCity: string) {
    const nextZone = deliveryZones.find((zone) => zone.city === nextCity);
    setCity(nextCity);
    setDepartment(nextZone?.department ?? "");
  }

  return (
    <>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold">
          <input
            checked={method === "PICKUP"}
            className="h-4 w-4 accent-primary"
            name="fulfillmentMethod"
            onChange={() => selectMethod("PICKUP")}
            type="radio"
            value="PICKUP"
          />
          Retiro en bodega
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold">
          <input
            checked={method === "LOCAL_DELIVERY"}
            className="h-4 w-4 accent-primary"
            name="fulfillmentMethod"
            onChange={() => selectMethod("LOCAL_DELIVERY")}
            type="radio"
            value="LOCAL_DELIVERY"
          />
          Envío local
        </label>
      </div>

      {isDelivery ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DeliveryField label="Dirección" name="addressLine1" required />
            <DeliveryField label="Casa, local o referencia" name="addressLine2" />
            <label className="block text-sm font-semibold">
              Municipio
              <select
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                name="city"
                onChange={(event) => selectCity(event.target.value)}
                required
                value={city}
              >
                <option value="">Selecciona municipio</option>
                {deliveryZones.map((zone) => (
                  <option key={zone.id} value={zone.city}>
                    {zone.name} · {formatCurrency(zone.feeCents)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Departamento
              <input
                className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                name="department"
                onChange={(event) => setDepartment(event.target.value)}
                required
                type="text"
                value={department}
              />
            </label>
          </div>

          <label className="block text-sm font-semibold">
            Notas de entrega
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              name="deliveryNotes"
              placeholder="Indicaciones, horario preferido o referencia del lugar"
            />
          </label>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-md border border-border bg-background">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-bold text-primary">Retiro en bodega</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {pickupLocation.address}.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {pickupLocation.pickupHours}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {pickupLocation.pickupInstructions}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-success">Costo de retiro: {formatCurrency(0)}</p>
                </div>
              </div>
            </div>
            <iframe
              className="h-56 w-full border-0 lg:h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={pickupLocation.mapUrl}
              title="Ubicación de bodega"
            />
          </div>
        </div>
      )}

      <div className="mt-4 rounded-md bg-primary/5 p-4 text-sm">
        <div className="flex gap-2 font-semibold text-primary">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Los precios de productos ya incluyen IVA.</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <DeliveryTotal label="Productos" value={formatCurrency(subtotalCents)} />
          <DeliveryTotal
            label="Envío"
            value={shippingCents === null ? "Selecciona municipio" : formatCurrency(shippingCents)}
          />
          <DeliveryTotal label="Total estimado" value={formatCurrency(totalCents)} strong />
        </div>
      </div>
    </>
  );
}

function DeliveryField({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
        name={name}
        required={required}
        type="text"
      />
    </label>
  );
}

function DeliveryTotal({
  label,
  strong,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="rounded-md bg-card p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className={strong ? "mt-1 text-lg font-bold text-primary" : "mt-1 font-semibold"}>{value}</p>
    </div>
  );
}
