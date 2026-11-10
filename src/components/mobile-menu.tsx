"use client";

import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { siteNavItems as navLinks } from "@/lib/nav";
import type { LocaleHref } from "@/lib/i18n/navigation";

type MobileMenuProps = {
  cartItemCount: number;
  accountHref: LocaleHref;
  accountLabel: string;
};


export function MobileMenu({
  cartItemCount,
  accountHref,
  accountLabel,
}: MobileMenuProps) {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // useSyncExternalStore devuelve false en SSR, true en cliente — sin setState en effect
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  // Accesibilidad: Escape cierra; foco entra al abrir y vuelve al trigger al cerrar
  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const trigger = triggerRef.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  const portal = mounted && open
    ? createPortal(
        <>
          {/* Overlay — rendered at body level, no stacking context trap */}
          <div
            className="fixed inset-0 z-[90] bg-ca-navy/60"
            aria-hidden
            onClick={() => setOpen(false)}
          />

          {/* Drawer lateral */}
          <div
            className="fixed inset-y-0 right-0 z-[100] flex w-72 max-w-[85vw] flex-col bg-ca-surface shadow-ca-overlay"
            role="dialog"
            aria-modal
            aria-label={t("menu")}
          >
            {/* Header del drawer */}
            <div className="flex items-center justify-between border-b border-ca-border px-5 py-4">
              <p className="text-sm font-bold text-ca-navy">{t("menu")}</p>
              <button
                type="button"
                aria-label={t("closeMenu")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-ca-control hover:bg-ca-bg"
                onClick={() => setOpen(false)}
                ref={closeButtonRef}
              >
                <X className="h-5 w-5 text-ca-text-secondary" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-1 p-4" aria-label={t("mobileLabel")}>
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center rounded-ca-control px-4 text-base font-bold text-ca-navy transition hover:bg-ca-bg"
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>

            <div className="mx-4 border-t border-ca-border" />

            {/* Cuenta + carrito */}
            <div className="flex flex-col gap-2 p-4">
              <Link
                href={accountHref}
                onClick={() => setOpen(false)}
                className="flex h-12 items-center gap-3 rounded-ca-control px-4 text-base font-bold text-ca-navy transition hover:bg-ca-bg"
              >
                <User className="h-5 w-5 text-ca-text-secondary" strokeWidth={1.8} />
                {accountLabel}
              </Link>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center gap-3 rounded-ca-control px-4 text-base font-bold text-ca-navy transition hover:bg-ca-bg"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 text-ca-text-secondary" strokeWidth={1.8} />
                  {cartItemCount > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-ca-control bg-ca-navy px-0.5 text-xs font-bold text-white">
                      {cartItemCount}
                    </span>
                  ) : null}
                </div>
                {t("cart")}
                {cartItemCount > 0 ? (
                  <span className="ml-auto text-sm font-semibold text-ca-text-secondary">
                    {t("cartItemCount", { count: cartItemCount })}
                  </span>
                ) : null}
              </Link>
            </div>

            {/* CTA */}
            <div className="mt-auto p-4">
              <Link
                href="/catalog"
                onClick={() => setOpen(false)}
                className={buttonVariants({ size: "lg" })}
              >
                {t("viewFullCatalog")}
              </Link>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <button
        type="button"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        aria-expanded={open}
        className={buttonVariants({ variant: "outline", className: "w-10 px-0" })}
        onClick={() => setOpen(true)}
        ref={triggerRef}
      >
        <Menu className="h-5 w-5" strokeWidth={1.9} />
      </button>

      {portal}
    </>
  );
}
