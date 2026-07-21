import Image from "next/image";
import Link from "next/link";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { isPurchasableStockStatus, type CatalogProduct } from "@/data/products";
import { formatCurrency } from "@/lib/money";
import { ProductVisual } from "./product-visual";
import { StockBadge } from "./stock-badge";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const isAvailable = isPurchasableStockStatus(product.stockStatus);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ca-border bg-white shadow-ca-soft transition duration-200 hover:-translate-y-1 hover:border-ca-border-hover hover:shadow-ca-premium">
      {/* Image area */}
      <Link
        aria-label={`Ver detalle de ${product.name}`}
        href={`/product/${product.slug}`}
        className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-white via-ca-background to-ca-surface-tint"
      >
        <div className="absolute inset-x-6 bottom-4 h-8 rounded-full bg-ca-navy-950/10 blur-xl" />
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-3 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="transition duration-300 group-hover:scale-105">
            <ProductVisual kind={product.category} seed={product.sku} />
          </div>
        )}
        <span className="absolute left-3 top-3">
          <StockBadge status={product.stockStatus} />
        </span>
        {/* Brand accent */}
        <span className="absolute right-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-ca-blue-700 shadow-[0_2px_6px_rgba(6,25,51,0.08)] backdrop-blur-sm">
          {product.brand}
        </span>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ca-text-secondary">{product.category}</p>
        <Link
          href={`/product/${product.slug}`}
          className="mt-1.5 line-clamp-2 min-h-12 text-[15px] font-black leading-[1.4] text-ca-navy-950 transition group-hover:text-ca-blue-700"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ca-text-secondary/70">
          SKU {product.sku}
        </p>
        <p className="mt-2.5 line-clamp-3 min-h-[58px] text-xs leading-[1.6] text-ca-text-secondary">
          <span className="font-black text-ca-navy-950">Compatible: </span>
          {product.compatibility}
        </p>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div>
            <span className="font-display text-2xl font-black text-ca-navy-950">
              {formatCurrency(product.priceCents)}
            </span>
          </div>
          <AddToCartForm
            available={isAvailable}
            buttonClassName="w-auto text-xs"
            sku={product.sku}
          />
        </div>
      </div>
    </article>
  );
}
