import { Link } from "@/lib/i18n/navigation";
import { MapPin, ShieldCheck, Truck, Wrench } from "lucide-react";
import { getCatalogFacets } from "@/data/products";
import { vehicleMakeSlug } from "@/data/vehicle-catalog";
import { DEFAULT_SUPPORT_MESSAGE, SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import type { Locale } from "@/lib/i18n/config";
import { getTranslations } from "next-intl/server";
import type { LocaleHref } from "@/lib/i18n/navigation";

/**
 * Footer global de la tienda. Async: obtiene marcas de vehículo reales
 * (cacheadas con tag "catalog") para los enlaces de /vehiculos/*.
 */
export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Footer" });
  let vehicleMakes: string[] = [];
  let partBrands: string[] = [];
  try {
    const facets = await getCatalogFacets(locale);
    vehicleMakes = facets.vehicleMakes.slice(0, 6);
    partBrands = facets.brands.slice(0, 6);
  } catch {
    // Sin marcas si el catálogo no responde; el footer no debe romper la página.
  }

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-ca-navy-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        {/* Marca */}
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-ca-control bg-ca-gold-400 text-ca-navy-950">
              <Wrench className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="leading-none">
              <span className="block font-display text-base font-black tracking-[0.12em]">CASTILLO</span>
              <span className="mt-1 block text-[10px] font-bold tracking-[0.28em] text-white/70">
                AUTO PARTS
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">{SITE_DESCRIPTION}</p>
          <div className="mt-4 space-y-2 text-sm font-semibold text-white/80">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-ca-gold-400" />
              {t("checkCompatibility")}
            </p>
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-ca-gold-400" />
              {t("deliveryArea")}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-ca-gold-400" />
              {t("country")}
            </p>
          </div>
        </div>

        {/* Tienda */}
        <FooterColumn title={t("shop")}>
          <FooterLink href="/catalog">{t("fullCatalog")}</FooterLink>
          <FooterLink href="/cart">{t("cart")}</FooterLink>
          <FooterLink href="/account">{t("myAccount")}</FooterLink>
          <FooterLink href="/account/orders">{t("myOrders")}</FooterLink>
        </FooterColumn>

        {/* Vehículos */}
        <FooterColumn title={t("byVehicle")}>
          {vehicleMakes.length > 0 ? (
            vehicleMakes.map((make) => (
              <FooterLink href={{ pathname: "/vehicles/[make]", params: { make: vehicleMakeSlug(make) } }} key={make}>
                {t("partsFor", { make })}
              </FooterLink>
            ))
          ) : (
            <FooterLink href="/catalog">{t("searchByVehicle")}</FooterLink>
          )}
        </FooterColumn>

        {/* Marcas de repuesto — la navegación por fabricante vive aquí, no
            como franja en la home: es un índice, no una sección destacada. */}
        {partBrands.length > 0 ? (
          <FooterColumn title={t("partBrands")}>
            {partBrands.map((brand) => (
              <FooterLink href={{ pathname: "/catalog", query: { brand } }} key={brand}>
                {brand}
              </FooterLink>
            ))}
          </FooterColumn>
        ) : null}

        {/* Soporte */}
        <FooterColumn title={t("support")}>
          <FooterLink href="/help">Centro de ayuda</FooterLink>
          {SUPPORT_WHATSAPP_NUMBER ? (
            <a
              className="block text-sm font-semibold text-white/70 transition hover:text-ca-gold-400"
              href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_SUPPORT_MESSAGE)}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("whatsapp")}
            </a>
          ) : null}
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs font-semibold text-white/55 sm:flex-row sm:px-6 lg:px-8">
          <p>
            {t("rights", { siteName: SITE_NAME, year })}
          </p>
          <p>{t("priceNotice")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-[0.14em] text-ca-gold-400">{title}</h2>
      <div className="mt-4 space-y-2.5">{children}</div>
    </div>
  );
}

function FooterLink({ children, href }: { children: React.ReactNode; href: LocaleHref }) {
  return (
    <Link
      className="block text-sm font-semibold text-white/70 transition hover:text-ca-gold-400"
      href={href}
    >
      {children}
    </Link>
  );
}
