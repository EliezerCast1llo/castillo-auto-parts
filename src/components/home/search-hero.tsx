import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CreditCard, MessageCircle, PackageCheck, Truck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { VehicleSelector } from "@/components/home/vehicle-selector";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import { Link } from "@/lib/i18n/navigation";

const deliverySignals = [
  { icon: PackageCheck, key: "warehousePickup" },
  { icon: Truck, key: "boxfulDelivery" },
  { icon: CreditCard, key: "cardPayment" },
] as const;

export async function SearchHero({
  filterOptions,
  locale,
}: {
  filterOptions: CatalogFilterOptions;
  locale: Locale;
}) {
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: "VehicleSearch" }),
    getTranslations({ locale, namespace: "Nav" }),
  ]);

  return (
    <section className="bg-ca-navy text-white">
      <div className="ca-container grid gap-y-4 py-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-x-8 lg:gap-y-0 lg:pb-8 lg:pt-0">
        <div className="lg:col-start-1 lg:row-start-1 lg:py-8">
          <h1 className="text-ca-hero-mobile font-bold lg:text-ca-hero">
            {t("heroTitleBefore")}{" "}
            <span className="block text-ca-accent">{t("heroTitleHighlight")}</span>
          </h1>
          <p className="mt-3 max-w-lg text-base leading-6 text-white/90">
            {t("heroSearchDescription")}
          </p>
        </div>

        <div className="rounded-ca-surface border border-ca-border bg-ca-surface p-3 text-ca-text lg:col-span-2 lg:row-start-2 lg:p-4">
          <div className="grid items-center gap-2 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-6">
            <h2 className="font-sans text-sm font-semibold text-ca-navy">
              {t("partSearchTitle")}
            </h2>
            <SearchAutocomplete variant="hero" />
          </div>
          <div className="mt-3 grid items-center gap-2 border-t border-ca-border pt-3 lg:mt-4 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-6 lg:pt-4">
            <h2 className="font-sans text-sm font-semibold text-ca-navy">
              {t("title")}
            </h2>
            <VehicleSelector filterOptions={filterOptions} />
          </div>
        </div>

        <div className="relative h-40 overflow-hidden rounded-ca-surface sm:h-52 lg:col-start-2 lg:row-start-1 lg:h-auto lg:rounded-none">
          <Image
            src="/hero-vehicle.jpg"
            alt={t("heroImageAlt")}
            fill
            sizes="(min-width: 1280px) 652px, (min-width: 1024px) 55vw, 100vw"
            fetchPriority="high"
            loading="eager"
            className="object-cover object-right"
          />
        </div>

        <ul className="ca-on-navy grid grid-cols-2 items-center gap-x-3 gap-y-2 pt-1 text-xs font-semibold lg:col-span-2 lg:row-start-3 lg:mt-5 lg:grid-cols-4 lg:gap-x-5 lg:text-sm">
          {deliverySignals.map(({ icon: Icon, key }) => (
            <li className="flex items-center gap-2" key={key}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-ca-accent" />
              {t(key)}
            </li>
          ))}
          <li>
            {SUPPORT_WHATSAPP_NUMBER ? (
              <WhatsAppCTA
                className="h-auto min-h-9 px-2 py-1"
                label={tNav("whatsappAdvice")}
                phone={SUPPORT_WHATSAPP_NUMBER}
                variant="inline"
              />
            ) : (
              <Link href="/help" className="inline-flex items-center gap-2 text-white underline-offset-4 hover:underline">
                <MessageCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-ca-accent" />
                {tNav("help")}
              </Link>
            )}
          </li>
        </ul>
      </div>
    </section>
  );
}
