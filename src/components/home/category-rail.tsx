import { Link } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { categoryLabelOf } from "@/data/catalog-filters";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { ProductVisual } from "@/components/product/product-visual";
import { ScrollCarousel } from "@/components/ui/scroll-carousel";

/**
 * Acceso a categorías como tarjetas desplazables.
 *
 * El patrón viene de las tiendas de repuestos grandes: una tarjeta por
 * categoría, con el nombre arriba y un panel de color abajo. Ahí ellos ponen
 * la foto del producto; como todavía no hay fotos, el panel lleva el icono de
 * la categoría, que al menos distingue una tarjeta de otra.
 *
 * Es scroll horizontal en vez de grilla para que no reviente en móvil y para
 * que aguante más categorías sin rediseñar.
 */
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
      <h2 className="text-xs font-black uppercase tracking-[0.1em] text-ca-navy-950">
        {t("shopByCategory")}
      </h2>

      <div className="mt-3">
        <ScrollCarousel
          autoPlay
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
                className="group flex h-full flex-col overflow-hidden rounded-ca-surface border border-ca-border bg-white transition-colors hover:border-ca-navy-950/30"
                href={{ pathname: "/catalog", query: { category: slug } }}
              >
                <span className="px-4 pb-3 pt-3.5">
                  <span className="block font-display text-sm font-extrabold uppercase tracking-[0.04em] text-ca-navy-950">
                    Explorar {category}
                  </span>
                  {typeof options.categoryCounts[slug] === "number" ? (
                    <span className="mt-0.5 block text-xs text-ca-text-secondary">
                      {options.categoryCounts[slug]}{" "}
                      {options.categoryCounts[slug] === 1
                        ? "producto"
                        : "productos"}
                    </span>
                  ) : null}
                </span>
                <span className="flex h-28 items-center justify-center bg-ca-navy-950">
                  {/* El slug y no la etiqueta: getProductVisualType matchea
                      palabras en español ("freno", "filtro"), así que con el
                      nombre traducido el icono caería al genérico en inglés. */}
                  <ProductVisual
                    kind={slug}
                    seed={slug}
                    size="card"
                    tone="text-ca-gold-400"
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
