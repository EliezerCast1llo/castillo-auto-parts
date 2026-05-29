import Link from "next/link";
import { ShoppingCart, User, Wrench } from "lucide-react";
import { auth } from "@/lib/auth";
import { getGuestCartItemCount } from "@/lib/cart";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";

export async function SiteHeader() {
  const [cartItemCount, session] = await Promise.all([
    getGuestCartItemCount(),
    auth(),
  ]);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary">
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

            {/* Botón de cuenta/sesión */}
            {session?.user ? (
              <Link
                href="/account"
                aria-label="Mi cuenta"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold text-primary"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {session.user.name?.split(" ")[0] ?? "Mi cuenta"}
                </span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                aria-label="Iniciar sesión"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold text-primary"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Ingresar</span>
              </Link>
            )}

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

        <SearchAutocomplete />
      </div>
    </header>
  );
}

function formatCartCount(count: number) {
  return count === 1 ? "1 producto" : `${count} productos`;
}
