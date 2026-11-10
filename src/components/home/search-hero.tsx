import { getTranslations } from "next-intl/server";
import { CreditCard, PackageCheck, Truck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { SearchAutocomplete } from "@/components/search/search-autocomplete";
import { VehicleSelector } from "@/components/home/vehicle-selector";

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
  const t = await getTranslations({ locale, namespace: "VehicleSearch" });
  return (
    <section className="border-b border-ca-border bg-ca-surface py-8 sm:py-12">
      <div className="ca-container space-y-6">
        <div>
          <h1 className="max-w-2xl text-2xl font-bold text-ca-navy sm:text-ca-title">
            {t("heroTitleBefore")} {t("heroTitleHighlight")}
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-6 text-ca-text-secondary">
            {t("heroSearchDescription")}
          </p>
        </div>
        <SearchAutocomplete variant="hero" />
        <VehicleSelector filterOptions={filterOptions} />
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ca-text-secondary">
          {deliverySignals.map(({ icon: Icon, key }) => (
            <li className="flex items-center gap-2" key={key}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-ca-navy" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
