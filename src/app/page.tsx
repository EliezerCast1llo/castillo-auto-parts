import {
  Car,
  CheckCircle2,
  Languages,
  MapPin,
  Search,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { mockCategories, mockProducts, vehicleMakes } from "@/data/mock-products";
import { formatCurrency } from "@/lib/money";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Codename
              </p>
              <h1 className="text-2xl font-bold text-primary">Castillo Auto Parts</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-primary"
                aria-label="Cambiar idioma"
              >
                <Languages className="h-5 w-5" />
              </button>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground"
                aria-label="Ver carrito"
              >
                <ShoppingCart className="h-5 w-5" />
              </button>
            </div>
          </div>

          <section className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_160px]">
            <label className="flex min-h-12 items-center gap-3 rounded-md bg-card px-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Busca por repuesto, SKU, numero de parte o vehiculo"
              />
            </label>
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </section>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="space-y-4">
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
        </aside>

        <section className="space-y-5">
          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-sm font-semibold text-success">MVP con datos mock</p>
            <h2 className="mt-1 text-2xl font-bold text-primary">
              Encuentra el repuesto correcto para tu vehiculo
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Catalogo inicial para validar busqueda, filtros, compatibilidad, retiro en bodega y
              envio local en San Salvador y Santa Tecla.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <TrustBadge icon={<CheckCircle2 className="h-5 w-5" />} label="Compatibilidad clara" />
              <TrustBadge icon={<MapPin className="h-5 w-5" />} label="Retiro o envio local" />
              <TrustBadge icon={<ShoppingCart className="h-5 w-5" />} label="Checkout guest" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mockProducts.map((product) => (
              <article key={product.sku} className="rounded-md border border-border bg-card p-4">
                <div className="flex h-36 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                  Imagen producto
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold leading-5">{product.name}</h3>
                    <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-semibold text-success">
                      {product.stockStatus}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.brand} · {product.partNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">{product.compatibility}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(product.priceCents)}
                    </span>
                    <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
                      Agregar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold">
      <span className="text-success">{icon}</span>
      {label}
    </div>
  );
}

