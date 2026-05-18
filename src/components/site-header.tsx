import Link from "next/link";
import { Languages, Search, ShoppingCart } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Codename
            </p>
            <h1 className="text-2xl font-bold text-primary">Castillo Auto Parts</h1>
          </Link>
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
          <Link
            href="/catalog"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Search className="h-4 w-4" />
            Buscar
          </Link>
        </section>
      </div>
    </header>
  );
}
