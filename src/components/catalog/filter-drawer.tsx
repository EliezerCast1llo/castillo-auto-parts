"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type FilterDrawerProps = {
  /** Textos ya resueltos: `Catalog` no viaja al navegador. */
  closeLabel: string;
  filtersLabel: string;
 activeFilterCount: number;
 children: React.ReactNode;
};

export function FilterDrawer({ activeFilterCount, children, closeLabel, filtersLabel }: FilterDrawerProps) {
 const [open, setOpen] = useState(false);
 const triggerRef = useRef<HTMLButtonElement>(null);
 const closeButtonRef = useRef<HTMLButtonElement>(null);

 useEffect(() => {
 document.body.style.overflow = open ? "hidden" : "";
 return () => { document.body.style.overflow = ""; };
 }, [open]);

 // Accesibilidad: Escape cierra; foco entra al abrir y vuelve al trigger al cerrar
 useEffect(() => {
 if (!open) return;

 closeButtonRef.current?.focus();

 const onKeyDown = (event: KeyboardEvent) => {
 if (event.key === "Escape") setOpen(false);
 };
 window.addEventListener("keydown", onKeyDown);

 const trigger = triggerRef.current;
 return () => {
 window.removeEventListener("keydown", onKeyDown);
 trigger?.focus();
 };
 }, [open]);

 return (
 <>
 {/* Botón fijo en mobile */}
 <div className="sticky top-0 z-30 -mx-4 border-b border-ca-border bg-white px-4 py-3 lg:hidden">
 <button
 type="button"
 aria-expanded={open}
 onClick={() => setOpen(true)}
 className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-ca-control border border-ca-border bg-white text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background"
 ref={triggerRef}
 >
 <SlidersHorizontal className="h-4 w-4" strokeWidth={1.9} />
 Filtrar catálogo
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

 {/* Drawer bottom sheet — inert cuando está cerrado para que sus inputs
 (duplicados del sidebar desktop) no sean tabulables ni lean lectores */}
 <div
 className={`fixed inset-x-0 bottom-0 z-[100] flex max-h-[85vh] flex-col rounded-t-[24px] bg-white shadow-ca-overlay transition-transform duration-300 lg:hidden ${
 open ? "translate-y-0" : "translate-y-full"
 }`}
 inert={!open}
 role="dialog"
 aria-modal
 aria-label={filtersLabel}
 >
 {/* Handle */}
 <div className="flex items-center justify-between border-b border-ca-border px-5 py-4">
 <p className="text-base font-black text-ca-navy-950">
 Filtrar catálogo
 {activeFilterCount > 0 ? (
 <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ca-navy-950 px-1.5 text-[11px] font-black text-white">
 {activeFilterCount}
 </span>
 ) : null}
 </p>
 <button
 type="button"
 aria-label={closeLabel}
 onClick={() => setOpen(false)}
 className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-ca-background"
 ref={closeButtonRef}
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
 className="inline-flex h-12 w-full items-center justify-center rounded-ca-control bg-ca-navy-950 text-sm font-black text-white"
 >
 Ver repuestos
 </button>
 </div>
 </div>
 </>
 );
}
