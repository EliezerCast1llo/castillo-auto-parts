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
    <section className="border-b border-ca-border bg-ca-bg">
      <div className="ca-on-navy bg-ca-navy text-white">
        <div className="ca-container grid lg:grid-cols-2">
          <div className="py-6 lg:py-12 lg:pr-10">
            <span aria-hidden="true" className="mb-3 block h-0.5 w-12 bg-ca-accent" />
            <h1 className="max-w-xl text-4xl font-bold leading-none sm:text-5xl lg:text-6xl">
              {t("heroTitleBefore")} <span className="text-ca-accent">{t("heroTitleHighlight")}</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/90 sm:text-base">
              {t("heroSearchDescription")}
            </p>
          </div>

          <div className="relative h-36 sm:h-52 lg:h-auto">
            <Image
              src="/hero-vehicle.jpg"
              alt={t("heroImageAlt")}
              fill
              sizes="(min-width: 1280px) 608px, (min-width: 1024px) 50vw, 100vw"
              fetchPriority="high"
              loading="eager"
              className="object-cover"
            />
          </div>
        </div>

        <ul className="ca-container grid grid-cols-2 items-center gap-x-3 gap-y-3 py-4 text-xs font-semibold sm:text-sm lg:grid-cols-4 lg:gap-x-5">
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

      <div className="ca-container space-y-4 py-6">
        <SearchAutocomplete variant="hero" />
        <VehicleSelector filterOptions={filterOptions} />
      </div>
    </section>
  );
}
