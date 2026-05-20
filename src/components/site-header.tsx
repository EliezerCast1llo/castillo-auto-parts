import Link from "next/link";
import { Languages, Search, ShoppingCart, Wrench } from "lucide-react";
import { getGuestCartItemCount } from "@/lib/cart";

export async function SiteHeader() {
  const cartItemCount = await getGuestCartItemCount();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-graphite text-white">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Repuestos automotrices
              </span>
              <span className="block truncate text-2xl font-bold text-primary">Castillo Auto Parts</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="hidden h-10 items-center rounded-md border border-border bg-card px-3 text-sm font-semibold text-primary sm:inline-flex"
              href="/catalog"
            >
              Catálogo
            </Link>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-primary"
              aria-label="Cambiar idioma"
            >
              <Languages className="h-5 w-5" />
            </button>
            <Link
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white"
              aria-label={`Ver carrito, ${formatCartCount(cartItemCount)}`}
              href="/cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white">
                  {cartItemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <form
          action="/catalog"
          className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_160px]"
        >
          <label className="flex min-h-12 items-center gap-3 rounded-md bg-card px-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              name="q"
              placeholder="Busca por repuesto, SKU, número de parte o vehículo"
              type="search"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white"
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>
        </form>
      </div>
    </header>
  );
}

function formatCartCount(count: number) {
  return count === 1 ? "1 producto" : `${count} productos`;
}
