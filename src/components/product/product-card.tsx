import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { isPurchasableStockStatus, type CatalogProduct } from "@/data/products";
import { MyVehicleCompatibility } from "./my-vehicle-compatibility";
import { ProductPrice } from "./product-price";
import { ProductVisual } from "./product-visual";
import { StockBadge } from "./stock-badge";

/**
 * Tarjeta de catálogo. Plana a propósito: borde de 1px, sin sombra y sin
 * levantar al hover. La media va sobre blanco liso, sin degradado ni panel
 * interior, para que la foto (cuando la haya) sea lo único que se vea.
 * La jerarquía la lleva el precio, no el peso uniforme de la tipografía.
 */
export async function ProductCard({
  product,
  locale,
}: {
  product: CatalogProduct;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Product" });
  const isAvailable = isPurchasableStockStatus(product.stockStatus);
  const href = { pathname: "/product/[slug]", params: { slug: product.slug } } as const;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-ca-surface border border-ca-border bg-white transition-colors hover:border-ca-navy-950/30">
      <Link
        aria-label={`Ver detalles del repuesto ${product.name}`}
        className="relative flex h-40 items-center justify-center border-b border-ca-border bg-white p-3"
        href={href}
      >
        {product.primaryImageUrl ? (
          <Image
            alt={product.name}
            className="object-contain p-1"
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            src={product.primaryImageUrl}
          />
        ) : (
          <ProductVisual kind={product.category} seed={product.sku} />
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-ca-text-secondary">
            {product.category}
          </p>
          <p className="shrink-0 text-[11px] font-black uppercase tracking-[0.08em] text-ca-navy-950">
            {product.brand}
          </p>
        </div>

        <Link
          className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-snug text-ca-navy-950 underline-offset-2 group-hover:underline"
          href={href}
        >
          {product.name}
        </Link>

        <p className="mt-1 text-xs text-ca-text-secondary">SKU {product.sku}</p>

        <p className="mt-2 line-clamp-2 min-h-8 text-xs leading-snug text-ca-text-secondary">
          <span className="font-bold text-ca-navy-950">{t("compatibleVehicle")}</span>
          {product.compatibility}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StockBadge status={product.stockStatus} />
          <MyVehicleCompatibility compatibilities={product.vehicleCompatibilities} />
        </div>

        <div className="mt-auto pt-3">
          <ProductPrice cents={product.priceCents} />
          <AddToCartForm
            available={isAvailable}
            buttonAriaLabel={`Agregar ${product.name} al carrito`}
            buttonClassName="mt-2 w-full rounded-ca-control shadow-none hover:shadow-none"
            sku={product.sku}
          />
        </div>
      </div>
    </article>
  );
}
