"use client";

import { Info, MapPin, X } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/money";
import type { FulfillmentMethod } from "@/lib/checkout";
import type { DeliveryZoneOption, PickupLocationOption } from "@/lib/fulfillment";
import { CheckoutLocationPicker, type LocationInfo } from "./checkout-location-picker";

type SavedAddress = {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  department: string;
  deliveryNotes: string | null;
  latitude: string | null;
  longitude: string | null;
};

type DeliveryFields = {
  addressLine1: string;
  addressLine2: string;
  deliveryZoneSlug: string;
  deliveryNotes: string;
};

export function CheckoutDeliveryFields({
  deliveryZones,
  isGuest,
  pickupLocation,
  savedAddresses,
  subtotalCents,
}: {
  deliveryZones: DeliveryZoneOption[];
  isGuest: boolean;
  pickupLocation: PickupLocationOption;
  savedAddresses: SavedAddress[];
  subtotalCents: number;
}) {
  const [method, setMethod] = useState<FulfillmentMethod>("PICKUP");
  const [selectedAddressId, setSelectedAddressId] = useState(
    savedAddresses.length > 0 ? savedAddresses[0].id : "",
  );
  const [guestFields, setGuestFields] = useState<DeliveryFields>({
    addressLine1: "",
    addressLine2: "",
    deliveryZoneSlug: "",
    deliveryNotes: "",
  });
  const [showAddressModal, setShowAddressModal] = useState(false);

  const isDelivery = method === "LOCAL_DELIVERY";
  const hasSavedAddresses = !isGuest && savedAddresses.length > 0;

  const selectedZone = deliveryZones.find((z) => z.slug === guestFields.deliveryZoneSlug);
  const selectedSavedAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const savedZone = hasSavedAddresses
    ? deliveryZones.find(
        (z) => z.city.toLowerCase() === (selectedSavedAddress?.city ?? "").toLowerCase(),
      )
    : undefined;

  const activeZone = hasSavedAddresses ? savedZone : selectedZone;
  const shippingCents = isDelivery ? (activeZone ? activeZone.feeCents : null) : 0;
  const totalCents = subtotalCents + (shippingCents ?? 0);

  function selectMethod(nextMethod: FulfillmentMethod) {
    setMethod(nextMethod);
  }

  function setGuestField(key: keyof DeliveryFields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setGuestFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function handleLocationFound(info: LocationInfo) {
    setGuestFields((prev) => {
      const matchedZone = deliveryZones.find(
        (z) =>
          z.city.toLowerCase() === info.city.toLowerCase() ||
          z.name.toLowerCase() === info.city.toLowerCase(),
      );
      return {
        ...prev,
        addressLine1: info.road || prev.addressLine1,
        deliveryZoneSlug: matchedZone?.slug ?? prev.deliveryZoneSlug,
      };
    });
  }

  return (
    <>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label
          className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold"
          onClick={() => selectMethod("PICKUP")}
        >
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
        <label
          className="flex min-h-12 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold"
          onClick={() => selectMethod("LOCAL_DELIVERY")}
        >
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
          {hasSavedAddresses ? (
            <SavedAddressSelector
              addresses={savedAddresses}
              deliveryZones={deliveryZones}
              selectedAddressId={selectedAddressId}
              selectedSavedAddress={selectedSavedAddress}
              savedZone={savedZone}
              setSelectedAddressId={setSelectedAddressId}
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold md:col-span-2">
                  Dirección
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                    name="addressLine1"
                    onChange={setGuestField("addressLine1")}
                    required
                    type="text"
                    value={guestFields.addressLine1}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Casa, local o referencia
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                    name="addressLine2"
                    onChange={setGuestField("addressLine2")}
                    type="text"
                    value={guestFields.addressLine2}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Municipio
                  <select
                    className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                    name="deliveryZoneSlug"
                    onChange={setGuestField("deliveryZoneSlug")}
                    required
                    value={guestFields.deliveryZoneSlug}
                  >
                    <option value="">Selecciona municipio</option>
                    {deliveryZones.map((zone) => (
                      <option key={zone.id} value={zone.slug}>
                        {zone.name} · {formatCurrency(zone.feeCents)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Departamento
                  <input
                    className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
                    readOnly
                    type="text"
                    value={selectedZone?.department ?? ""}
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold">
                Notas de entrega
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  name="deliveryNotes"
                  onChange={setGuestField("deliveryNotes")}
                  placeholder="Indicaciones, horario preferido o referencia del lugar"
                  value={guestFields.deliveryNotes}
                />
              </label>

              {isGuest ? <CheckoutLocationPicker onLocationFound={handleLocationFound} /> : null}

              {/* Botón que abre el modal de confirmación antes de continuar al pago */}
              {isGuest && guestFields.addressLine1 && selectedZone ? (
                <button
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-ca-border bg-ca-background text-sm font-bold text-ca-navy-950 transition hover:bg-white"
                  onClick={() => setShowAddressModal(true)}
                  type="button"
                >
                  <MapPin className="h-4 w-4" />
                  Ver resumen de dirección
                </button>
              ) : null}
            </>
          )}
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
                  <p className="mt-3 text-sm font-semibold text-success">
                    Costo de retiro: {formatCurrency(0)}
                  </p>
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

      {showAddressModal ? (
        <DeliveryAddressModal
          addressLine1={guestFields.addressLine1}
          addressLine2={guestFields.addressLine2}
          city={selectedZone?.city ?? ""}
          department={selectedZone?.department ?? ""}
          deliveryNotes={guestFields.deliveryNotes}
          onClose={() => setShowAddressModal(false)}
        />
      ) : null}
    </>
  );
}

function SavedAddressSelector({
  addresses,
  deliveryZones,
  selectedAddressId,
  selectedSavedAddress,
  savedZone,
  setSelectedAddressId,
}: {
  addresses: SavedAddress[];
  deliveryZones: DeliveryZoneOption[];
  selectedAddressId: string;
  selectedSavedAddress: SavedAddress | undefined;
  savedZone: DeliveryZoneOption | undefined;
  setSelectedAddressId: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ca-navy-950">Dirección guardada</p>
        <div className="mt-2 space-y-2">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 text-sm transition ${
                selectedAddressId === address.id
                  ? "border-ca-navy-950 bg-ca-navy-950/5"
                  : "border-border bg-background"
              }`}
            >
              <input
                checked={selectedAddressId === address.id}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                name="_savedAddressId"
                onChange={() => setSelectedAddressId(address.id)}
                type="radio"
                value={address.id}
              />
              <div className="min-w-0">
                <p className="font-semibold text-ca-navy-950">{address.formattedAddress}</p>
                {address.addressLine2 ? (
                  <p className="text-muted-foreground">{address.addressLine2}</p>
                ) : null}
                <p className="text-muted-foreground">
                  {address.city}, {address.department}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {selectedSavedAddress ? (
        <>
          <input type="hidden" name="addressLine1" value={selectedSavedAddress.addressLine1} />
          {selectedSavedAddress.addressLine2 ? (
            <input type="hidden" name="addressLine2" value={selectedSavedAddress.addressLine2} />
          ) : null}
          <input type="hidden" name="deliveryZoneSlug" value={savedZone?.slug ?? ""} />
          {selectedSavedAddress.latitude ? (
            <input type="hidden" name="latitude" value={selectedSavedAddress.latitude} />
          ) : null}
          {selectedSavedAddress.longitude ? (
            <input type="hidden" name="longitude" value={selectedSavedAddress.longitude} />
          ) : null}
          {selectedSavedAddress.deliveryNotes ? (
            <input type="hidden" name="deliveryNotes" value={selectedSavedAddress.deliveryNotes} />
          ) : null}
        </>
      ) : null}

      <p className="text-sm text-muted-foreground">
        ¿Quieres enviar a otra dirección?{" "}
        <a className="font-semibold text-ca-navy-950 underline" href="/account/addresses">
          Administra tus direcciones
        </a>
      </p>
    </div>
  );
}

function DeliveryAddressModal({
  addressLine1,
  addressLine2,
  city,
  department,
  deliveryNotes,
  onClose,
}: {
  addressLine1: string;
  addressLine2: string;
  city: string;
  department: string;
  deliveryNotes: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 shrink-0 text-ca-navy-950" />
            <h2 className="text-lg font-black text-ca-navy-950">Dirección de entrega</h2>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-md p-1 text-ca-text-secondary hover:bg-ca-background"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3 rounded-xl bg-ca-background p-4 text-sm">
          <ModalRow label="Dirección" value={addressLine1} />
          {addressLine2 ? <ModalRow label="Referencia" value={addressLine2} /> : null}
          <ModalRow label="Municipio" value={city} />
          <ModalRow label="Departamento" value={department} />
          {deliveryNotes ? <ModalRow label="Notas" value={deliveryNotes} /> : null}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          ¿Algo incorrecto?{" "}
          <button
            className="font-semibold text-ca-navy-950 underline"
            onClick={onClose}
            type="button"
          >
            Editar dirección
          </button>
        </p>

        <button
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[14px] border border-ca-border bg-white text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background"
          onClick={onClose}
          type="button"
        >
          Cerrar
        </button>
      </div>
    </div>
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
      <p className={strong ? "mt-1 text-lg font-bold text-primary" : "mt-1 font-semibold"}>
        {value}
      </p>
    </div>
  );
}

function ModalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-24 shrink-0 font-semibold text-ca-text-secondary">{label}</span>
      <span className="font-medium text-ca-navy-950">{value}</span>
    </div>
  );
}
