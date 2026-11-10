import { BrandLockup } from "@/components/brand-lockup";
import { Link } from "@/lib/i18n/navigation";
import { MapPin, ShieldCheck, Truck } from "lucide-react";
import { getCatalogFacets } from "@/data/products";
import { vehicleMakeSlug } from "@/data/vehicle-catalog";
import { SUPPORT_WHATSAPP_NUMBER, buildContactLinks } from "@/lib/contact";
import { SITE_NAME } from "@/lib/site";
import type { Locale } from "@/lib/i18n/config";
import { getTranslations } from "next-intl/server";
import type { LocaleHref } from "@/lib/i18n/navigation";

/**
 * Footer global de la tienda. Async: obtiene marcas de vehículo reales
 * (cacheadas con tag "catalog") para los enlaces de /vehiculos/*.
 */
export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Footer" });
  const tWhatsApp = await getTranslations({ locale, namespace: "Common.whatsapp" });
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
    <footer className="ca-on-navy bg-ca-navy text-white">
      <div className="ca-container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        {/* Marca */}
        <div>
          <BrandLockup onDark />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/80">{t("description")}</p>
          <div className="mt-4 space-y-2 text-sm font-semibold text-white/80">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-white/80" />
              {t("checkCompatibility")}
            </p>
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-white/80" />
              {t("deliveryArea")}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-white/80" />
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
          <FooterLink href="/help">{t("helpCenter")}</FooterLink>
          {SUPPORT_WHATSAPP_NUMBER ? (
            <a
              className="block text-sm font-semibold text-white/80 transition hover:text-white hover:underline"
              href={buildContactLinks(SUPPORT_WHATSAPP_NUMBER, tWhatsApp("message")).whatsapp}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("whatsapp")}
            </a>
          ) : null}
        </FooterColumn>
      </div>

      <div className="border-t border-white/20">
        <div className="ca-container flex flex-col items-center justify-between gap-2 py-4 text-xs font-semibold text-white/80 sm:flex-row">
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
      <h2 className="text-base font-bold text-white">{title}</h2>
      <div className="mt-4 space-y-2.5">{children}</div>
    </div>
  );
}

function FooterLink({ children, href }: { children: React.ReactNode; href: LocaleHref }) {
  return (
    <Link
      className="block text-sm font-semibold text-white/80 transition hover:text-white hover:underline"
      href={href}
    >
      {children}
    </Link>
  );
}
