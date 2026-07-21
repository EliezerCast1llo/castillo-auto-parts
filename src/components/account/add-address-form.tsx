"use client";

import { MapPin, X } from "lucide-react";
import { useRef, useState } from "react";
import { createAddress } from "@/app/account/addresses/actions";
import { CheckoutLocationPicker, type LocationInfo } from "@/components/checkout/checkout-location-picker";
import type { DeliveryZoneOption } from "@/lib/fulfillment";

type Fields = {
  addressLine1: string;
  addressLine2: string;
  deliveryZoneSlug: string;
  deliveryNotes: string;
};

export function AddAddressForm({ deliveryZones }: { deliveryZones: DeliveryZoneOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [fields, setFields] = useState<Fields>({
    addressLine1: "",
    addressLine2: "",
    deliveryZoneSlug: "",
    deliveryNotes: "",
  });
  const [showModal, setShowModal] = useState(false);

  const selectedZone = deliveryZones.find((z) => z.slug === fields.deliveryZoneSlug);

  function set(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function handleLocationFound(info: LocationInfo) {
    setFields((prev) => {
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) return;
    e.preventDefault();
    if (!fields.addressLine1.trim() || !selectedZone) return;
    setShowModal(true);
  }

  function handleConfirm() {
    confirmedRef.current = true;
    setShowModal(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={createAddress} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-ca-navy-950">
              Dirección *
              <input
                className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
                name="addressLine1"
                onChange={set("addressLine1")}
                placeholder="Calle, avenida o pasaje"
                required
                type="text"
                value={fields.addressLine1}
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-ca-navy-950">
            Casa, local o referencia
            <input
              className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
              name="addressLine2"
              onChange={set("addressLine2")}
              type="text"
              value={fields.addressLine2}
            />
          </label>
          <label className="block text-sm font-semibold text-ca-navy-950">
            Municipio *
            <select
              className="mt-2 h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none focus:border-ca-navy-950"
              onChange={set("deliveryZoneSlug")}
              required
              value={fields.deliveryZoneSlug}
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
            onChange={set("deliveryNotes")}
            placeholder="Indicaciones, horario preferido o referencia del lugar"
            value={fields.deliveryNotes}
          />
        </label>

        <CheckoutLocationPicker onLocationFound={handleLocationFound} />

        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-ca-button transition hover:bg-ca-navy-800"
          type="submit"
        >
          Revisar y guardar
        </button>
      </form>

      {showModal ? (
        <AddressConfirmModal
          addressLine1={fields.addressLine1}
          addressLine2={fields.addressLine2}
          city={selectedZone?.city ?? ""}
          department={selectedZone?.department ?? ""}
          deliveryNotes={fields.deliveryNotes}
          onCancel={() => setShowModal(false)}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}

function AddressConfirmModal({
  addressLine1,
  addressLine2,
  city,
  department,
  deliveryNotes,
  onCancel,
  onConfirm,
}: {
  addressLine1: string;
  addressLine2: string;
  city: string;
  department: string;
  deliveryNotes: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 shrink-0 text-ca-navy-950" />
            <h2 className="text-lg font-black text-ca-navy-950">Confirma tu dirección</h2>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-md p-1 text-ca-text-secondary hover:bg-ca-background"
            onClick={onCancel}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3 rounded-xl bg-ca-background p-4 text-sm">
          <Row label="Dirección" value={addressLine1} />
          {addressLine2 ? <Row label="Referencia" value={addressLine2} /> : null}
          <Row label="Municipio" value={city} />
          <Row label="Departamento" value={department} />
          {deliveryNotes ? <Row label="Notas" value={deliveryNotes} /> : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-[14px] border border-ca-border bg-white text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background"
            onClick={onCancel}
            type="button"
          >
            Editar
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-ca-button transition hover:bg-ca-navy-800"
            onClick={onConfirm}
            type="button"
          >
            Guardar dirección
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-24 shrink-0 font-semibold text-ca-text-secondary">{label}</span>
      <span className="font-medium text-ca-navy-950">{value}</span>
    </div>
  );
}
