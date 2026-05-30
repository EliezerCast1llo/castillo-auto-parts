import Link from "next/link";
import { ShoppingCart, User, Wrench } from "lucide-react";
import { auth } from "@/lib/auth";
import { getGuestCartItemCount } from "@/lib/cart";
import { MobileMenu } from "@/components/mobile-menu";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";

export async function SiteHeader() {
  const [cartItemCount, session] = await Promise.all([
    getGuestCartItemCount(),
    auth(),
  ]);

  const accountHref = session?.user ? "/account" : "/auth/login";
  const accountLabel = session?.user
    ? (session.user.name?.split(" ")[0] ?? "Mi cuenta")
    : "Ingresar";

  return (
    <header className="sticky top-0 z-50 border-b border-ca-border bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-ca-navy-950 text-white">
              <Wrench className="h-4.5 w-4.5 h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <span className="hidden leading-none sm:block">
              <span className="block text-sm font-black tracking-[0.1em] text-ca-navy-950">CASTILLO</span>
              <span className="block text-[10px] font-bold tracking-[0.2em] text-ca-text-secondary">AUTO PARTS</span>
            </span>
          </Link>

          {/* Buscador — ocupa espacio disponible */}
          <div className="flex-1">
            <SearchAutocomplete />
          </div>

          {/* Acciones */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Catálogo desktop */}
            <Link
              className="hidden h-10 items-center rounded-xl border border-ca-border px-3 text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background sm:inline-flex"
              href="/catalog"
            >
              Catálogo
            </Link>

            {/* Cuenta desktop */}
            <Link
              href={accountHref}
              aria-label={accountLabel}
              className="hidden h-10 items-center gap-2 rounded-xl border border-ca-border px-3 text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background md:inline-flex"
            >
              <User className="h-4 w-4 text-ca-text-secondary" />
              <span className="hidden sm:inline">{accountLabel}</span>
            </Link>

            {/* Carrito */}
            <Link
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ca-navy-950 text-white transition hover:bg-ca-navy-800"
              aria-label={`Ver carrito, ${cartItemCount === 1 ? "1 producto" : `${cartItemCount} productos`}`}
              href="/cart"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
              {cartItemCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ca-gold-400 px-1 text-[10px] font-black text-ca-navy-950">
                  {cartItemCount}
                </span>
              ) : null}
            </Link>

            {/* Hamburguesa mobile */}
            <div className="md:hidden">
              <MobileMenu
                cartItemCount={cartItemCount}
                accountHref={accountHref}
                accountLabel={accountLabel}
                variant="light"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
