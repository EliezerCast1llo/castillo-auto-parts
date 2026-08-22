import { Link } from "@/lib/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, Truck } from "lucide-react";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  type BreadcrumbEntry,
} from "@/lib/structured-data";
import { MyVehicleCompatibility } from "@/components/product/my-vehicle-compatibility";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPrice } from "@/components/product/product-price";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { StockBadge } from "@/components/product/stock-badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppCTA } from "@/components/whatsapp-cta";
import {
  getCatalogProductBySlug,
  getRelatedCatalogProducts,
  type CatalogProduct,
} from "@/data/products";
import { categorySlugOf } from "@/data/catalog-filters";
import { SUPPORT_WHATSAPP_NUMBER } from "@/lib/contact";

import { localizedAlternates } from "@/lib/i18n/metadata";
import { getPathname } from "@/lib/i18n/navigation";
import { resolveAndPublishRouteLocale } from "@/lib/i18n/params";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const locale = await resolveAndPublishRouteLocale(params);
  const product = await getCatalogProductBySlug(slug, locale);

  const tMeta = await getTranslations({ locale, namespace: "Product" });
  if (!product) return { title: tMeta("notFoundTitle") };

  const description =
    product.description ||
    tMeta("metaDescription", {
      brand: product.brand,
      compatibility: product.compatibility,
      name: product.name,
    });

  return {
    title: `${product.name} | Castillo Auto Parts`,
    description,
    alternates: localizedAlternates(
      { pathname: "/product/[slug]", params: { slug: product.slug } },
      locale,
    ),
    openGraph: {
      title: product.name,
      description,
      url: getPathname({
        href: { pathname: "/product/[slug]", params: { slug: product.slug } },
        locale,
      }),
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const locale = await resolveAndPublishRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Product" });
  const product = await getCatalogProductBySlug(slug, locale);

  if (!product) notFound();

  const relatedProducts = await getRelatedCatalogProducts(product, locale);
  const isAvailable = product.stockStatus !== "OUT_OF_STOCK";
  // El mensaje que se abre en WhatsApp lo escribe el cliente, así que va en su
  // idioma: es el punto de contacto comercial, no un texto interno.
  const supportMessage = t("supportMessage", {
    name: product.name,
    partNumber: product.partNumber,
    sku: product.sku,
  });

  const breadcrumbs: BreadcrumbEntry[] = [
    { name: t("home"), path: "/" },
    { name: t("catalog"), path: "/catalog" },
    // El nombre se lee, el slug filtra. Con el nombre traducido en la URL, el
    // breadcrumb del JSON-LD en inglés apuntaba a `?category=Brakes`, que no
    // encuentra nada.
    {
      name: product.category,
      path: `/catalog?category=${encodeURIComponent(categorySlugOf(product))}`,
    },
    { name: product.name, path: `/product/${product.slug}` },
  ];

  return (
    <main className="min-h-screen bg-ca-background text-ca-text-primary">
      <JsonLd data={buildProductJsonLd(product, locale)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs, locale)} />
      <SiteHeader locale={locale} />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <ProductBreadcrumb product={product} t={t} />

        {/* Cuerpo principal — aside va abajo en mobile, lateral en lg */}
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">

          {/* Panel izquierdo: galería + descripción + compatibilidad */}
          <div className="space-y-4">
            <div className="rounded-ca-surface border border-ca-border bg-white p-4">
              <ProductGallery
                images={product.images.map((image, index) => ({
                  ...image,
                  label: t("viewImage", { alt: image.alt, index: index + 1 }),
                }))}
                productName={product.name}
                productSku={product.sku}
              />
            </div>

            <div className="rounded-ca-surface border border-ca-border bg-white p-5">
              <h2 className="text-base font-black text-ca-navy-950">{t("description")}</h2>
              <p className="mt-3 text-sm leading-6 text-ca-text-secondary">{product.description}</p>
            </div>

            {product.compatibleVehicles.length > 0 ? (
              <div className="rounded-ca-surface border border-ca-border bg-white p-5">
                <h2 className="text-base font-black text-ca-navy-950">{t("compatibleVehicles")}</h2>
                <div className="mt-3 empty:hidden">
                  <MyVehicleCompatibility compatibilities={product.vehicleCompatibilities} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {product.compatibleVehicles.map((vehicle) => (
                    <div
                      key={vehicle}
                      className="flex min-h-11 items-center gap-2 rounded-ca-control bg-ca-background px-3 text-sm font-medium text-ca-text-primary"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-ca-success" />
                      {vehicle}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.technicalDetails.length > 0 ? (
              <div className="rounded-ca-surface border border-ca-border bg-white p-5">
                <h2 className="text-base font-black text-ca-navy-950">{t("technicalDetails")}</h2>
                <ul className="mt-3 space-y-2">
                  {product.technicalDetails.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm text-ca-text-secondary">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ca-success" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Panel derecho: precio + compra (en mobile va después de la galería) */}
          <aside className="h-fit rounded-ca-surface border border-ca-border bg-white p-5">
            {/* Categoría + título + badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-ca-gold-500">
                  {product.category}
                </p>
                <h1 className="mt-1 text-2xl font-black leading-tight text-ca-navy-950">
                  {product.name}
                </h1>
              </div>
              <StockBadge locale={locale} status={product.stockStatus} />
            </div>

            {/* Datos del producto */}
            <dl className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
              <InfoItem label={t("brand")} value={product.brand} />
              <InfoItem label={t("partNumber")} value={product.partNumber} />
              <InfoItem label={t("sku")} value={product.sku} />
              <InfoItem label={t("availability")} value={t("units", { count: product.stockQuantity })} />
            </dl>

            {/* Precio */}
            <div className="mt-5 rounded-ca-control bg-ca-background px-4 py-3">
              <p className="text-xs font-bold text-ca-text-secondary">Precio con IVA incluido</p>
              <ProductPrice className="mt-1.5" cents={product.priceCents} size="lg" />
            </div>

            <div className="mt-4 rounded-ca-control border border-ca-border bg-white p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ca-success" />
                <div>
                  <p className="text-sm font-black text-ca-navy-950">Revisa la compatibilidad antes de comprar</p>
                  <p className="mt-1 text-sm leading-6 text-ca-text-secondary">
                    {t("checkCompatibility")}
                  </p>
                </div>
              </div>
            </div>

            {/* Acción principal */}
            <AddToCartForm
              available={isAvailable}
              buttonClassName="h-[52px] rounded-ca-control"
              buttonSize="lg"
              className="mt-4 space-y-3"
              label={t("addToCart")}
              sku={product.sku}
            >
              <label className="block text-sm font-bold text-ca-navy-950">
                {t("quantity")}
                <div className="mt-2">
                  <QuantityStepper disabled={!isAvailable} max={product.stockQuantity} />
                </div>
              </label>
            </AddToCartForm>

            <WhatsAppCTA
              className="mt-2.5 w-full"
              label={t("validateWithAdvisor")}
              message={supportMessage}
              phone={SUPPORT_WHATSAPP_NUMBER}
            />

            {/* Envío */}
            <div className="mt-4 flex items-start gap-3 rounded-ca-control bg-ca-background p-4 text-sm">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-ca-success" />
              <div>
                <p className="font-bold text-ca-navy-950">Retiro en bodega o entrega local</p>
                <p className="mt-1 text-ca-text-secondary">
                  {t("deliveryNotice")}
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Productos relacionados */}
        {relatedProducts.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-black text-ca-navy-950">Productos relacionados</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map((item) => (
                <ProductCard key={item.sku} locale={locale} product={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <SiteFooter locale={locale} />
    </main>
  );
}

type ProductTranslator = Awaited<ReturnType<typeof getTranslations<"Product">>>;

function ProductBreadcrumb({
  product,
  t,
}: {
  product: CatalogProduct;
  t: ProductTranslator;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav
        aria-label={t("breadcrumbAriaLabel")}
        className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-bold text-ca-text-secondary"
      >
        <Link className="transition hover:text-ca-navy-950" href="/">
          {t("home")}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-ca-text-secondary/50" />
        <Link className="transition hover:text-ca-navy-950" href="/catalog">
          {t("catalog")}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-ca-text-secondary/50" />
        <Link
          className="transition hover:text-ca-navy-950"
          href={{ pathname: "/catalog", query: { category: categorySlugOf(product) } }}
        >
          {product.category}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-ca-text-secondary/50" />
        <span className="line-clamp-1 text-ca-navy-950">{product.name}</span>
      </nav>

      <Link
        href="/catalog"
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-ca-control border border-ca-border bg-white px-3 text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToCatalog")}
      </Link>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-ca-control bg-ca-background p-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-ca-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold text-ca-navy-950">{value}</dd>
    </div>
  );
}
