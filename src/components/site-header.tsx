import { Link } from "@/lib/i18n/navigation";
import { MessageCircle, ShoppingCart, Truck, User, UserRound, Wrench } from "lucide-react";
import { auth } from "@/lib/auth";
import { getGuestCartItemCount } from "@/lib/cart";
import { MobileMenu } from "@/components/mobile-menu";
import { MyVehicleChip } from "@/components/my-vehicle-chip";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { buttonVariants } from "@/components/ui/button";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { siteNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { LocaleHref } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

type SiteHeaderProps = {
  /**
   * Idioma del contenido. Se recibe y no se deduce: `getLocale()` resuelve el
   * segmento de forma poco confiable en componentes anidados y cae al idioma
   * por defecto sin avisar, así que el header terminaba en español dentro de
   * páginas en inglés.
   */
  locale: Locale;
  /**
   * "default": header claro sticky con buscador (páginas internas).
   * "hero": header navy con utility bar (home).
   */
  variant?: "default" | "hero";
};

export async function SiteHeader({ locale, variant = "default" }: SiteHeaderProps) {
  const tNav = await getTranslations({ locale, namespace: "Nav" });
  const [cartItemCount, session] = await Promise.all([
    getGuestCartItemCount(),
    auth(),
  ]);

  const accountHref = session?.user ? "/account" : "/auth/login";
  const accountLabel = session?.user
    ? (session.user.name?.split(" ")[0] ?? "Mi cuenta")
    : "Ingresar";

  if (variant === "hero") {
    return (
      <HeroHeader
        locale={locale}
        accountHref={accountHref}
        accountLabel={accountLabel}
        cartItemCount={cartItemCount}
      />
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ca-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">

          {/* Logo */}
          <Link href="/" className="order-1 flex shrink-0 items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-ca-navy-950 text-white">
              <Wrench className="h-[18px] w-[18px]" strokeWidth={2} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-ca-gold-400" />
            </span>
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-[15px] font-black tracking-[0.14em] text-ca-navy-950">CASTILLO</span>
              <span className="block text-[9px] font-bold tracking-[0.28em] text-ca-text-secondary">AUTO PARTS</span>
            </span>
          </Link>

          {/* Search */}
          <div className="order-3 w-full min-w-0 sm:order-2 sm:flex-1">
            <SearchAutocomplete />
          </div>

          {/* Actions */}
          <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3 sm:ml-0">
            <MyVehicleChip />

            <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
              {siteNavItems.map((item) => (
                <Link
                  className="inline-flex h-10 items-center rounded-ca-control px-3 text-sm font-bold text-ca-navy-950 transition hover:bg-ca-background"
                  href={item.href}
                  key={item.key}
                >
                  {tNav(item.key)}
                </Link>
              ))}
            </nav>

            <div className="hidden xl:block">
              <WhatsAppCTA
                label="Asesoría"
                phone={SUPPORT_WHATSAPP_NUMBER}
                variant="subtle"
              />
            </div>

            <Link
              href={accountHref}
              aria-label={accountLabel}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hidden px-3 font-bold lg:inline-flex",
              )}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{accountLabel}</span>
            </Link>

            {/* Cart — gold accent button */}
            <Link
              className={cn(buttonVariants({ variant: "primary" }), "relative w-10 px-0")}
              aria-label={`Ver carrito, ${cartItemCount === 1 ? "1 producto" : `${cartItemCount} productos`}`}
              href="/cart"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
              {cartItemCount > 0 ? (
                <span
                  data-testid="cart-count"
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ca-gold-400 px-1 text-[10px] font-black text-ca-navy-950"
                >
                  {cartItemCount}
                </span>
              ) : null}
            </Link>

            <div className="lg:hidden">
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

// ---------------------------------------------------------------------------
// Variante hero (home): header navy con utility bar
// ---------------------------------------------------------------------------

type HeroHeaderProps = {
  locale: Locale;
  accountHref: LocaleHref;
  accountLabel: string;
  cartItemCount: number;
};

async function HeroHeader({ accountHref, accountLabel, cartItemCount, locale }: HeroHeaderProps) {
  const tNav = await getTranslations({ locale, namespace: "Nav" });
  return (
    <header className="bg-ca-navy-950 text-white">
      <UtilityBar />
      <div className="ca-container flex min-h-16 items-center justify-between gap-5 py-3">
        {/* Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-ca-gold-400 text-ca-navy-950">
            <Wrench className="h-6 w-6" strokeWidth={2} />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate text-xl font-black tracking-[0.1em]">CASTILLO</span>
            <span className="mt-1 block truncate text-xs font-bold tracking-[0.28em] text-white/78">
              AUTO PARTS
            </span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegación principal">
          {siteNavItems.map((item) => (
            <Link
              className="inline-flex items-center gap-1 text-sm font-bold text-white/88 transition hover:text-ca-gold-400"
              href={item.href}
              key={item.key}
            >
              {tNav(item.key)}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cuenta — visible en desktop */}
          <Link
            className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-white/88 transition hover:bg-white/10 md:inline-flex"
            href={accountHref}
          >
            <UserRound className="h-5 w-5" strokeWidth={1.8} />
            {accountLabel}
          </Link>

          <div className="hidden xl:block">
            <WhatsAppCTA
              label="Asesoría"
              phone={SUPPORT_WHATSAPP_NUMBER}
              variant="subtle"
            />
          </div>

          {/* Carrito */}
          <Link
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/[0.16]"
            aria-label={`Ver carrito, ${cartItemCount === 1 ? "1 producto" : `${cartItemCount} productos`}`}
            href="/cart"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
            {cartItemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ca-gold-400 px-1 text-[11px] font-black text-ca-navy-950">
                {cartItemCount}
              </span>
            ) : null}
          </Link>

          {/* Hamburguesa mobile */}
          <div className="lg:hidden">
            <MobileMenu
              cartItemCount={cartItemCount}
              accountHref={accountHref}
              accountLabel={accountLabel}
              variant="dark"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function UtilityBar() {
  return (
    <div className="border-b border-white/10 bg-ca-navy-950">
      <div className="ca-container flex min-h-9 items-center justify-between gap-4 py-1 text-xs font-bold text-white/78">
        {/* Dato concreto y acción, no promesas: las de "garantía / entrega /
            pago seguro" ya se dicen en el hero y se repetían aquí. */}
        <p className="inline-flex items-center gap-1.5 tracking-[0.01em] text-white/76">
          <Truck className="h-4 w-4 shrink-0 text-ca-gold-400" strokeWidth={1.9} />
          <span className="hidden sm:inline">Entrega en San Salvador y Santa Tecla</span>
          <span className="sm:hidden">San Salvador y Santa Tecla</span>
        </p>

        {SUPPORT_WHATSAPP_NUMBER ? (
          <a
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-white/76 transition hover:text-white"
            href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-ca-gold-400" strokeWidth={1.9} />
            Asesoría por WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
