import { getCatalogFilterOptions } from "@/data/catalog-filters";
import { mockProducts } from "@/data/mock-products";
import { SearchHero } from "./search-hero";

export function HomeHero() {
  return <SearchHero filterOptions={getCatalogFilterOptions(mockProducts)} />;
}
