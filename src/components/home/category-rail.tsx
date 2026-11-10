import { Link } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { categoryLabelOf } from "@/data/catalog-filters";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { ProductVisual } from "@/components/product/product-visual";
import { ScrollCarousel } from "@/components/ui/scroll-carousel";

/** Accesos a categorías con desplazamiento manual en todos los tamaños. */
export async function CategoryQuickLinks({
  options,
  locale,
}: {
  options: CatalogFilterOptions;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Catalog" });
  if (options.categories.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold text-ca-navy">
        {t("shopByCategory")}
      </h2>

      <div className="mt-3">
        <ScrollCarousel
          label={t("carouselLabel")}
          nextLabel={t("carouselNext")}
          previousLabel={t("carouselPrevious")}
        >
          {options.categories.map((slug) => {
            const category = categoryLabelOf(options, slug);

            return (
            <div
              className="w-[168px] shrink-0 snap-start sm:w-[190px]"
              key={slug}
            >
              <Link
                className="group flex h-full flex-col overflow-hidden rounded-ca-surface border border-ca-border border-t-2 border-t-ca-accent bg-ca-surface transition-colors hover:border-ca-navy/30"
                href={{ pathname: "/catalog", query: { category: slug } }}
              >
                <span className="px-4 pb-3 pt-3.5">
                  <span className="block text-sm font-semibold text-ca-navy">
                    {category}
                  </span>
                  {typeof options.categoryCounts[slug] === "number" ? (
                    <span className="mt-0.5 block text-xs text-ca-text-secondary">
                      {t("productCount", { count: options.categoryCounts[slug] })}
                    </span>
                  ) : null}
                </span>
                <span className="flex h-28 items-center justify-center border-t border-ca-border bg-ca-bg">
                  {/* El slug y no la etiqueta: getProductVisualType matchea
                      palabras en español ("freno", "filtro"), así que con el
                      nombre traducido el icono caería al genérico en inglés. */}
                  <ProductVisual
                    kind={slug}
                    seed={slug}
                    size="card"
                    tone="text-ca-navy"
                  />
                </span>
              </Link>
            </div>
            );
          })}
        </ScrollCarousel>
      </div>
    </section>
  );
}
