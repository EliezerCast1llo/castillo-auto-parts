import { SlidersHorizontal } from "lucide-react";
import { mockCategories } from "@/data/mock-products";

export function ProductFilters() {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Filtros</h2>
      </div>
      <div className="space-y-2">
        {mockCategories.map((category) => (
          <label key={category} className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-primary" />
            {category}
          </label>
        ))}
      </div>
    </section>
  );
}
