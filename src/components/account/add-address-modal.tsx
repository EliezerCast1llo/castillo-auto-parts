"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { MapPin, Plus, X } from "lucide-react";
import { createAddress } from "@/app/account/addresses/actions";

const DEPARTMENTS = [
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad",
  "La Paz", "La Unión", "Morazán", "San Miguel", "San Salvador",
  "San Vicente", "Santa Ana", "Sonsonate", "Usulután",
];

const inputClass =
  "h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 text-sm outline-none transition focus:border-ca-navy-950 focus:ring-2 focus:ring-ca-navy-950/10";

export function AddAddressModal() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createAddress(fd);
      setOpen(false);
    });
  }

  const modal = open
    ? createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[90] bg-ca-navy-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 z-[100] w-full max-w-lg -translate-y-1/2 rounded-2xl border border-ca-border bg-white shadow-[var(--ca-shadow-hero)] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ca-border px-5 py-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ca-navy-950" />
                <h2 className="text-base font-black text-ca-navy-950">Nueva dirección</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ca-background"
              >
                <X className="h-4 w-4 text-ca-text-secondary" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label htmlFor="addressLine1" className="block text-sm font-bold text-ca-navy-950">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  required
                  type="text"
                  placeholder="Calle, número, colonia o residencial"
                  autoComplete="address-line1"
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
                  type="text"
                  placeholder="Apto, local, edificio"
                  autoComplete="address-line2"
                  className={`mt-2 ${inputClass}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className="block text-sm font-bold text-ca-navy-950">
                    Municipio <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    required
                    type="text"
                    placeholder="Ej: Santa Tecla"
                    className={`mt-2 ${inputClass}`}
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-bold text-ca-navy-950">
                    Departamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="department"
                    name="department"
                    required
                    defaultValue=""
                    className={`mt-2 ${inputClass} cursor-pointer`}
                  >
                    <option value="" disabled>Selecciona</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="deliveryNotes" className="block text-sm font-bold text-ca-navy-950">
                  Indicaciones de entrega{" "}
                  <span className="font-normal text-ca-text-secondary">(opcional)</span>
                </label>
                <textarea
                  id="deliveryNotes"
                  name="deliveryNotes"
                  rows={2}
                  placeholder="Ej: Portón azul, timbre 2 veces"
                  className="mt-2 w-full resize-none rounded-xl border border-ca-border bg-ca-background px-3 py-2.5 text-sm outline-none transition focus:border-ca-navy-950 focus:ring-2 focus:ring-ca-navy-950/10"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-11 flex-1 rounded-xl border border-ca-border text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="h-11 flex-1 rounded-xl bg-ca-navy-950 text-sm font-black text-white shadow-[0_6px_14px_rgba(6,25,51,0.18)] transition hover:bg-ca-navy-800 disabled:opacity-60"
                >
                  {pending ? "Guardando…" : "Guardar dirección"}
                </button>
              </div>
            </form>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-ca-navy-950 px-4 text-sm font-black text-white shadow-[0_6px_14px_rgba(6,25,51,0.15)] transition hover:bg-ca-navy-800"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Nueva dirección
      </button>

      {modal}
    </>
  );
}
