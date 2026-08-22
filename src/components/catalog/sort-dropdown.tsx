"use client";

import { ArrowUpDown } from "lucide-react";
// Router plano a proposito: este control no cambia de ruta, solo reescribe la
// query de la URL actual, que ya viene con su prefijo de idioma. Pasar por el
// router con idioma obligaria a re-declarar la ruta y sus params sin ganar nada.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { catalogSortOptions, type CatalogSort } from "@/data/catalog-filters";

type SortDropdownProps = {
  sortLabel: string;
  /**
   * Texto ya resuelto. Llega por prop y no de un `useTranslations` porque
   * `Catalog` no viaja al navegador: mandarlo entero por un aria-label
   * significaría enviar todo el copy del catálogo en cada página del sitio.
   */
  ariaLabel: string;
  value: CatalogSort;
};

export function SortDropdown({ sortLabel, ariaLabel, value }: SortDropdownProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="flex w-full flex-col gap-1.5 sm:w-auto">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-ca-text-secondary">
        {sortLabel}
      </span>
      <span className="inline-flex h-11 min-w-[210px] items-center gap-2 rounded-ca-control border border-ca-border bg-white px-3 text-sm font-black text-ca-navy-950 transition focus-within:border-ca-blue-700">
        <ArrowUpDown className="h-4 w-4 shrink-0 text-ca-blue-700" strokeWidth={1.9} />
        <select
          aria-label={ariaLabel}
          className="h-full w-full bg-transparent outline-none"
          onChange={(event) => {
            const nextSort = event.target.value as CatalogSort;
            const params = new URLSearchParams(searchParams.toString());

            params.delete("page");
            if (nextSort === "relevance") {
              params.delete("sort");
            } else {
              params.set("sort", nextSort);
            }

            const query = params.toString();
            router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
          }}
          value={value}
        >
          {catalogSortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
