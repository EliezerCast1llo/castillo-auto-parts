import { Link } from "@/lib/i18n/navigation";
import { ShoppingCart, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCartItemCount } from "@/lib/cart";
import { MobileMenu } from "@/components/mobile-menu";
import { MyVehicleChip } from "@/components/my-vehicle-chip";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { buttonVariants } from "@/components/ui/button";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { siteNavItems, type SiteNavKey } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { BrandLockup } from "@/components/brand-lockup";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { LocaleSwitch } from "@/components/locale-switch";

type SiteHeaderProps = {
  locale: Locale;
  showSearch?: boolean;
  activeNav?: SiteNavKey;
};

export async function SiteHeader({ locale, showSearch = true, activeNav }: SiteHeaderProps) {
  const [tNav, cartItemCount, session] = await Promise.all([
    getTranslations({ locale, namespace: "Nav" }),
    getCartItemCount(),
    auth(),
  ]);

  const accountHref = session?.user ? "/account" : "/auth/login";
  const accountLabel = session?.user
    ? (session.user.name?.split(" ")[0] || tNav("myAccount"))
    : tNav("signIn");

  return (
    <header className="sticky top-0 z-50 border-b border-ca-border bg-ca-surface">
      <div className="ca-container flex flex-col gap-3 py-3">
        <div className="flex flex-wrap items-center gap-3">

          <div className="order-1">
            <BrandLockup />
          </div>

          {showSearch ? (
            <div className="order-3 w-full min-w-0 sm:order-2 sm:flex-1">
              <SearchAutocomplete />
            </div>
          ) : null}

          {/* Actions */}
          <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3">
            <MyVehicleChip />

            <nav aria-label={tNav("ariaLabel")} data-testid="site-nav" className="hidden items-center gap-1 lg:flex">
              {siteNavItems.map((item) => (
                <Link
                  aria-current={activeNav === item.key ? "true" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center rounded-ca-control border-b-2 border-transparent px-3 text-sm font-bold text-ca-navy transition hover:bg-ca-bg",
                    activeNav === item.key && "border-ca-accent",
                  )}
                  href={item.href}
                  key={item.key}
                >
                  {tNav(item.key)}
                </Link>
              ))}
            </nav>

            <div className="hidden xl:block">
              <WhatsAppCTA
                label={tNav("advisory")}
                phone={SUPPORT_WHATSAPP_NUMBER}
                variant="subtle"
              />
            </div>

            <LocaleSwitch current={locale} label={tNav("languageSwitch")} tone="onLight" />

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

            <Link
              className={cn(buttonVariants({ variant: "primary" }), "relative w-10 px-0")}
              aria-label={tNav("viewCart", { count: cartItemCount })}
              href="/cart"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
              {cartItemCount > 0 ? (
                <span
                  data-testid="cart-count"
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-ca-pill bg-ca-accent px-1 text-xs font-bold text-ca-navy"
                >
                  {cartItemCount}
                </span>
              ) : null}
            </Link>

            <div className="lg:hidden">
              <MobileMenu
                activeNav={activeNav}
                cartItemCount={cartItemCount}
                accountHref={accountHref}
                accountLabel={accountLabel}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
