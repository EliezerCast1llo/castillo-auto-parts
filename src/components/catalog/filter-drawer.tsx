"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

type FilterDrawerProps = {
  activeFilterCount: number;
  children: React.ReactNode;
};

export function FilterDrawer({ activeFilterCount, children }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Botón fijo en mobile */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-ca-border bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ca-border bg-white text-sm font-bold text-ca-navy-950 shadow-sm transition hover:bg-ca-background"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.9} />
          Filtros
          {activeFilterCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ca-navy-950 px-1.5 text-[11px] font-black text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-[90] bg-ca-navy-950/60 backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* Drawer bottom sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[100] flex max-h-[85vh] flex-col rounded-t-[24px] bg-white shadow-ca-hero transition-transform duration-300 lg:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal
        aria-label="Filtros"
      >
        {/* Handle */}
        <div className="flex items-center justify-between border-b border-ca-border px-5 py-4">
          <p className="text-base font-black text-ca-navy-950">
            Filtros
            {activeFilterCount > 0 ? (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ca-navy-950 px-1.5 text-[11px] font-black text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </p>
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-ca-background"
          >
            <X className="h-5 w-5 text-ca-text-secondary" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer con botón aplicar */}
        <div className="border-t border-ca-border p-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-ca-navy-950 text-sm font-black text-white"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </>
  );
}
