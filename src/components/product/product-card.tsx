import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { addCartItem } from "@/app/cart/actions";
import { isPurchasableStockStatus, type CatalogProduct } from "@/data/products";
import { formatCurrency } from "@/lib/money";
import { ProductVisual } from "./product-visual";
import { StockBadge } from "./stock-badge";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const isAvailable = isPurchasableStockStatus(product.stockStatus);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ca-border bg-white shadow-[var(--ca-shadow-soft)] transition duration-200 hover:-translate-y-1 hover:border-[#c3cfdd] hover:shadow-[var(--ca-shadow-premium)]">
      {/* Image area */}
      <Link
        aria-label={`Ver detalle de ${product.name}`}
        href={`/product/${product.slug}`}
        className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-white via-ca-background to-[#dde7f1]"
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
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ca-border pt-4">
          <div>
            <span
              className="text-2xl text-ca-navy-950"
              style={{ fontFamily: "var(--font-display), ui-sans-serif", fontWeight: 900 }}
            >
              {formatCurrency(product.priceCents)}
            </span>
          </div>
          <form action={addCartItem}>
            <input name="sku" type="hidden" value={product.sku} />
            <input name="quantity" type="hidden" value="1" />
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ca-navy-950 px-4 text-xs font-black text-white shadow-[0_6px_14px_rgba(6,25,51,0.15)] transition hover:bg-ca-navy-800 hover:shadow-[0_8px_18px_rgba(6,25,51,0.22)] disabled:bg-[#EEF2F6] disabled:text-[#7B8798] disabled:shadow-none"
              disabled={!isAvailable}
            >
              <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
              {isAvailable ? "Agregar" : "No disponible"}
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
