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
    <header className="sticky top-0 z-50 border-b border-ca-border bg-white/95 shadow-[0_2px_16px_rgba(6,25,51,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-ca-navy-950 text-white shadow-[0_4px_14px_rgba(6,25,51,0.3)]">
              <Wrench className="h-[18px] w-[18px]" strokeWidth={2} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-ca-gold-400" />
            </span>
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-[15px] font-900 tracking-[0.14em] text-ca-navy-950" style={{ fontFamily: "var(--font-display), ui-sans-serif", fontWeight: 900 }}>CASTILLO</span>
              <span className="block text-[9px] font-bold tracking-[0.28em] text-ca-text-secondary">AUTO PARTS</span>
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1">
            <SearchAutocomplete />
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              className="hidden h-10 items-center rounded-xl border border-ca-border bg-white px-3 text-sm font-bold text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white sm:inline-flex"
              href="/catalog"
            >
              Catálogo
            </Link>

            <Link
              href={accountHref}
              aria-label={accountLabel}
              className="hidden h-10 items-center gap-2 rounded-xl border border-ca-border bg-white px-3 text-sm font-bold text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white md:inline-flex"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{accountLabel}</span>
            </Link>

            {/* Cart — gold accent button */}
            <Link
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ca-navy-950 text-white shadow-[0_4px_14px_rgba(6,25,51,0.22)] transition hover:bg-ca-navy-800 hover:shadow-[0_6px_18px_rgba(6,25,51,0.3)]"
              aria-label={`Ver carrito, ${cartItemCount === 1 ? "1 producto" : `${cartItemCount} productos`}`}
              href="/cart"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
              {cartItemCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ca-gold-400 px-1 text-[10px] font-black text-ca-navy-950 shadow-[0_2px_6px_rgba(217,162,27,0.5)]">
                  {cartItemCount}
                </span>
              ) : null}
            </Link>

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
