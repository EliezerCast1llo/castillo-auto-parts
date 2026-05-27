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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ca-border bg-white shadow-[var(--ca-shadow-soft)] transition hover:-translate-y-0.5 hover:border-[#c3cfdd] hover:shadow-[var(--ca-shadow-premium)]">
      <Link
        aria-label={`Ver detalle de ${product.name}`}
        href={`/product/${product.slug}`}
        className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-white via-ca-background to-[#dde7f1]"
      >
        <div className="absolute inset-x-5 bottom-5 h-8 rounded-full bg-ca-navy-950/10 blur-xl" />
        <ProductVisual kind={product.category} seed={product.sku} />
        <span className="absolute left-3 top-3">
          <StockBadge status={product.stockStatus} />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-ca-blue-700">{product.brand}</p>
          <p className="text-[11px] font-black uppercase text-ca-text-secondary">{product.category}</p>
        </div>
        <Link
          href={`/product/${product.slug}`}
          className="mt-2 line-clamp-2 min-h-12 text-base font-black leading-6 text-ca-navy-950 transition group-hover:text-ca-blue-700"
        >
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-1 text-xs font-bold uppercase text-ca-text-secondary">
          SKU: {product.sku} · {product.partNumber}
        </p>
        <p className="mt-3 line-clamp-3 min-h-[60px] text-sm leading-5 text-ca-text-secondary">
          <span className="font-black text-ca-navy-950">Compatible con: </span>
          {product.compatibility}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-2xl font-black text-ca-navy-950">{formatCurrency(product.priceCents)}</span>
          <form action={addCartItem}>
            <input name="sku" type="hidden" value={product.sku} />
            <input name="quantity" type="hidden" value="1" />
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-ca-navy-950 px-4 text-sm font-black text-white shadow-[0_10px_18px_rgba(6,25,51,0.14)] transition hover:bg-ca-navy-800 disabled:bg-[#EEF2F6] disabled:text-[#7B8798] disabled:shadow-none"
              disabled={!isAvailable}
            >
              <ShoppingCart className="h-4 w-4" strokeWidth={1.9} />
              {isAvailable ? "Agregar" : "No disponible"}
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
