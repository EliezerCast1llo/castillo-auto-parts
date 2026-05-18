import { Car } from "lucide-react";
import { vehicleMakes } from "@/data/mock-products";

export function VehicleSearchPanel() {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Car className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Busca por vehiculo</h2>
      </div>
      <div className="space-y-3">
        <select className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm">
          <option>Marca</option>
          {vehicleMakes.map((make) => (
            <option key={make}>{make}</option>
          ))}
        </select>
        <select className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm">
          <option>Modelo</option>
          <option>Corolla</option>
          <option>Sentra</option>
          <option>Accent</option>
        </select>
        <select className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm">
          <option>Año</option>
          <option>2022</option>
          <option>2021</option>
          <option>2020</option>
        </select>
        <button className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-foreground">
          Validar compatibilidad
        </button>
      </div>
    </section>
  );
}
