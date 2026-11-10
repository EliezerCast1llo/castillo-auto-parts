"use client";

import { buttonVariants } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type FilterDrawerProps = {
  viewPartsLabel: string;
  /** Textos ya resueltos: `Catalog` no viaja al navegador. */
  closeLabel: string;
  filtersLabel: string;
  filterCatalogLabel: string;
 activeFilterCount: number;
 children: React.ReactNode;
};

export function FilterDrawer({ viewPartsLabel, activeFilterCount, children, closeLabel, filtersLabel, filterCatalogLabel }: FilterDrawerProps) {
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
 <div className="sticky top-0 z-30 -mx-4 border-b border-ca-border bg-ca-surface px-4 py-3 lg:hidden">
 <button
 type="button"
 aria-expanded={open}
 onClick={() => setOpen(true)}
 className={buttonVariants({ variant: "outline", className: "w-full" })}
 ref={triggerRef}
 >
 <SlidersHorizontal className="h-4 w-4" strokeWidth={1.9} />
 {filterCatalogLabel}
 {activeFilterCount > 0 ? (
 <span className="flex h-5 min-w-5 items-center justify-center rounded-ca-pill bg-ca-navy px-1.5 text-xs font-bold text-white">
 {activeFilterCount}
 </span>
 ) : null}
 </button>
 </div>

 {/* Overlay */}
 {open ? (
 <div
 className="fixed inset-0 z-[90] bg-ca-navy/60 lg:hidden"
 aria-hidden
 onClick={() => setOpen(false)}
 />
 ) : null}

 {/* Drawer bottom sheet — inert cuando está cerrado para que sus inputs
 (duplicados del sidebar desktop) no sean tabulables ni lean lectores */}
 <div
 className={`fixed inset-x-0 bottom-0 z-[100] flex max-h-[85vh] flex-col rounded-t-ca-surface bg-ca-surface shadow-ca-overlay transition-transform duration-300 lg:hidden ${
 open ? "translate-y-0" : "translate-y-full"
 }`}
 inert={!open}
 role="dialog"
 aria-modal
 aria-label={filtersLabel}
 >
 {/* Handle */}
 <div className="flex items-center justify-between border-b border-ca-border px-5 py-4">
 <p className="text-base font-bold text-ca-navy">
 {filterCatalogLabel}
 {activeFilterCount > 0 ? (
 <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-ca-pill bg-ca-navy px-1.5 text-xs font-bold text-white">
 {activeFilterCount}
 </span>
 ) : null}
 </p>
 <button
 type="button"
 aria-label={closeLabel}
 onClick={() => setOpen(false)}
 className="inline-flex h-9 w-9 items-center justify-center rounded-ca-control hover:bg-ca-bg"
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
 className={buttonVariants({ size: "lg", className: "w-full" })}
 >
 {viewPartsLabel}
 </button>
 </div>
 </div>
 </>
 );
}
