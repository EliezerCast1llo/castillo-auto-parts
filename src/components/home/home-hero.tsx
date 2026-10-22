import { getCatalogFilterOptions } from "@/data/catalog-filters";
import { mockProducts } from "@/data/mock-products";
import { SearchHero } from "./search-hero";
import type { Locale } from "@/lib/i18n/config";

export function HomeHero({ locale }: { locale: Locale }) {
  return <SearchHero filterOptions={getCatalogFilterOptions(mockProducts)} locale={locale} />;
}
