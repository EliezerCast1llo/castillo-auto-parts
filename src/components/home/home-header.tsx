import Link from "next/link";
import {
  ChevronDown,
  Languages,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getGuestCartItemCount } from "@/lib/cart";

const navItems = [
  { label: "Catálogo", href: "/catalog", hasMenu: true },
  { label: "Marcas", href: "/catalog?brand=Bosch" },
  { label: "Ofertas", href: "/catalog?stock=Últimas unidades" },
  { label: "Ayuda", href: "/catalog?q=soporte", hasMenu: true },
];

export async function HomeHeader() {
  const [cartItemCount, session] = await Promise.all([
    getGuestCartItemCount(),
    auth(),
  ]);

  const accountHref = session?.user ? "/account" : "/auth/login";
  const accountLabel = session?.user
    ? (session.user.name?.split(" ")[0] ?? "Mi cuenta")
    : "Ingresar";

  return (
    <header className="bg-ca-navy-950 text-white">
      <UtilityBar />
      <MainNavbar cartItemCount={cartItemCount} accountHref={accountHref} accountLabel={accountLabel} />
    </header>
  );
}

export function UtilityBar() {
  return (
    <div className="border-b border-white/10 bg-ca-navy-950">
      <div className="ca-container flex min-h-9 items-center justify-between gap-4 py-1 text-xs font-bold text-white/78">
        <p className="hidden tracking-[0.01em] text-white/76 md:block">
          Repuestos originales <span className="mx-2 text-ca-gold-400">•</span> Entrega rápida
        </p>
        <p className="tracking-[0.01em] text-white/76 md:hidden">Compra segura</p>

        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <ShieldCheck className="h-4 w-4 text-ca-gold-400" strokeWidth={1.9} />
            Garantía
          </span>
          <span className="hidden h-4 w-px bg-white/14 sm:block" />
          <span className="hidden items-center gap-1.5 whitespace-nowrap sm:inline-flex">
            <Truck className="h-4 w-4 text-ca-gold-400" strokeWidth={1.9} />
            Entrega local
          </span>
          <span className="h-4 w-px bg-white/14" />
          <button className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-white/86 transition hover:bg-white/10">
            <Languages className="h-4 w-4" strokeWidth={1.9} />
            ES
          </button>
        </div>
      </div>
    </div>
  );
}

export function MainNavbar({ cartItemCount, accountHref, accountLabel }: { cartItemCount: number; accountHref: string; accountLabel: string }) {
  return (
    <div className="ca-container flex min-h-16 items-center justify-between gap-5 py-3">
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-ca-gold-400 text-ca-navy-950 shadow-[0_10px_24px_rgba(217,162,27,0.25)]">
          <Wrench className="h-6 w-6" strokeWidth={2} />
        </span>
        <span className="min-w-0 leading-none">
          <span className="block truncate text-xl font-black tracking-[0.1em]">CASTILLO</span>
          <span className="mt-1 block truncate text-xs font-bold tracking-[0.28em] text-white/78">
            AUTO PARTS
          </span>
        </span>
      </Link>

      <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegación principal">
        {navItems.map((item) => (
          <Link
            className="inline-flex items-center gap-1 text-sm font-bold text-white/88 transition hover:text-ca-gold-400"
            href={item.href}
            key={item.label}
          >
            {item.label}
            {item.hasMenu ? <ChevronDown className="h-4 w-4" /> : null}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-white/88 transition hover:bg-white/10 md:inline-flex"
          href={accountHref}
        >
          <UserRound className="h-5 w-5" strokeWidth={1.8} />
          {accountLabel}
        </Link>
        <Link
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/[0.16]"
          aria-label={`Ver carrito, ${formatCartCount(cartItemCount)}`}
          href="/cart"
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
          {cartItemCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ca-gold-400 px-1 text-[11px] font-black text-ca-navy-950">
              {cartItemCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}

function formatCartCount(count: number) {
  return count === 1 ? "1 producto" : `${count} productos`;
}
