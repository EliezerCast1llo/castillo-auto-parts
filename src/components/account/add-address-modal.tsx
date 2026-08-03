"use client";

import { MapPin, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createAddress } from "@/app/account/addresses/actions";
import { CheckoutLocationPicker, type LocationInfo } from "@/components/checkout/checkout-location-picker";
import type { DeliveryZoneOption } from "@/lib/fulfillment";

type Step = "form" | "confirm";

type Fields = {
  addressLine1: string;
  addressLine2: string;
  deliveryZoneSlug: string;
  city: string;
  department: string;
  deliveryNotes: string;
};

const inputClass =
  "h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none transition focus:border-ca-navy-950 focus:ring-2 focus:ring-ca-navy-950/10";

export function AddAddressModal({ deliveryZones }: { deliveryZones: DeliveryZoneOption[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState<Fields>({
    addressLine1: "",
    addressLine2: "",
    deliveryZoneSlug: "",
    city: "",
    department: "",
    deliveryNotes: "",
  });

  const selectedZone = deliveryZones.find((z) => z.slug === fields.deliveryZoneSlug);

  function set(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      if (key === "deliveryZoneSlug") {
        const zone = deliveryZones.find((z) => z.slug === value);
        setFields((prev) => ({
          ...prev,
          deliveryZoneSlug: value,
          city: zone?.city ?? "",
          department: zone?.department ?? "",
        }));
      } else {
        setFields((prev) => ({ ...prev, [key]: value }));
      }
    };
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
        city: matchedZone?.city ?? prev.city,
        department: matchedZone?.department ?? prev.department,
      };
    });
  }

  function handleClose() {
    setOpen(false);
    setStep("form");
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fields.addressLine1.trim() || !fields.city || !fields.department) return;
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    setSaving(true);
    setOpen(false);
    setStep("form");

    try {
      await createAddress(fd);
    } finally {
      setSaving(false);
    }
  }

  const modal =
    open
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[90] bg-ca-navy-950/50 backdrop-blur-sm"
              onClick={handleClose}
            />

            <div className="fixed inset-x-4 top-1/2 z-[100] w-full max-w-lg -translate-y-1/2 rounded-2xl border border-ca-border bg-white shadow-ca-hero sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-ca-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ca-navy-950" />
                  <h2 className="text-base font-black text-ca-navy-950">
                    {step === "confirm" ? "Confirma tu dirección" : "Nueva dirección"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ca-background"
                >
                  <X className="h-4 w-4 text-ca-text-secondary" />
                </button>
              </div>

              <form
                ref={formRef}
                hidden={step !== "form"}
                onSubmit={handleFormSubmit}
                className="max-h-[80vh] space-y-4 overflow-y-auto p-5"
              >
                  {/* Hidden fields consumed by the server action */}
                  <input type="hidden" name="city" value={fields.city} />
                  <input type="hidden" name="department" value={fields.department} />

                  <div>
                    <label htmlFor="addressLine1" className="block text-sm font-bold text-ca-navy-950">
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="addressLine1"
                      name="addressLine1"
                      onChange={set("addressLine1")}
                      placeholder="Calle, número, colonia o residencial"
                      required
                      type="text"
                      value={fields.addressLine1}
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="addressLine2" className="block text-sm font-bold text-ca-navy-950">
                      Referencia{" "}
                      <span className="font-normal text-ca-text-secondary">(opcional)</span>
                    </label>
                    <input
                      id="addressLine2"
                      name="addressLine2"
                      onChange={set("addressLine2")}
                      placeholder="Apto, local, edificio"
                      type="text"
                      value={fields.addressLine2}
                      className={`mt-2 ${inputClass}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="deliveryZoneSlug" className="block text-sm font-bold text-ca-navy-950">
                      Municipio <span className="text-red-500">*</span>
                    </label>
                    {deliveryZones.length > 0 ? (
                      <select
                        id="deliveryZoneSlug"
                        onChange={set("deliveryZoneSlug")}
                        required
                        value={fields.deliveryZoneSlug}
                        className={`mt-2 ${inputClass} cursor-pointer`}
                      >
                        <option value="">Selecciona municipio</option>
                        {deliveryZones.map((zone) => (
                          <option key={zone.id} value={zone.slug}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="deliveryZoneSlug"
                        onChange={(e) =>
                          setFields((prev) => ({ ...prev, city: e.target.value }))
                        }
                        placeholder="Ej: Santa Tecla"
                        required
                        type="text"
                        value={fields.city}
                        className={`mt-2 ${inputClass}`}
                      />
                    )}
                  </div>

                  {deliveryZones.length > 0 ? (
                    <div>
                      <label className="block text-sm font-bold text-ca-navy-950">
                        Departamento
                      </label>
                      <input
                        className={`mt-2 ${inputClass} cursor-default`}
                        readOnly
                        type="text"
                        value={selectedZone?.department ?? ""}
                      />
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="deliveryNotes" className="block text-sm font-bold text-ca-navy-950">
                      Indicaciones de entrega{" "}
                      <span className="font-normal text-ca-text-secondary">(opcional)</span>
                    </label>
                    <textarea
                      id="deliveryNotes"
                      name="deliveryNotes"
                      onChange={set("deliveryNotes")}
                      placeholder="Ej: Portón azul, timbre 2 veces"
                      rows={2}
                      value={fields.deliveryNotes}
                      className="mt-2 w-full resize-none rounded-xl border border-ca-border bg-ca-background px-3 py-2.5 text-sm outline-none transition focus:border-ca-navy-950 focus:ring-2 focus:ring-ca-navy-950/10"
                    />
                  </div>

                  <CheckoutLocationPicker onLocationFound={handleLocationFound} />

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="h-11 flex-1 rounded-xl border border-ca-border text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="h-11 flex-1 rounded-xl bg-ca-navy-950 text-sm font-black text-white shadow-ca-button transition hover:bg-ca-navy-800"
                    >
                      Revisar dirección
                    </button>
                  </div>
              </form>

              {step === "confirm" ? (
                <div className="p-5">
                  <p className="text-sm text-ca-text-secondary">
                    Verifica que los datos sean correctos antes de guardar.
                  </p>

                  <div className="mt-4 space-y-3 rounded-xl bg-ca-background p-4 text-sm">
                    <ConfirmRow label="Dirección" value={fields.addressLine1} />
                    {fields.addressLine2 ? (
                      <ConfirmRow label="Referencia" value={fields.addressLine2} />
                    ) : null}
                    <ConfirmRow label="Municipio" value={fields.city} />
                    <ConfirmRow label="Departamento" value={fields.department} />
                    {fields.deliveryNotes ? (
                      <ConfirmRow label="Notas" value={fields.deliveryNotes} />
                    ) : null}
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("form")}
                      className="h-11 flex-1 rounded-xl border border-ca-border text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background"
                    >
                      Editar
                    </button>
                    <button
                      disabled={saving}
                      onClick={handleConfirm}
                      type="button"
                      className="h-11 flex-1 rounded-xl bg-ca-navy-950 text-sm font-black text-white shadow-ca-button transition hover:bg-ca-navy-800 disabled:opacity-60"
                    >
                      {saving ? "Guardando…" : "Guardar dirección"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-ca-navy-950 px-4 text-sm font-black text-white shadow-ca-button transition hover:bg-ca-navy-800"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Nueva dirección
      </button>

      {modal}
    </>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-24 shrink-0 font-semibold text-ca-text-secondary">{label}</span>
      <span className="font-medium text-ca-navy-950">{value}</span>
    </div>
  );
}
