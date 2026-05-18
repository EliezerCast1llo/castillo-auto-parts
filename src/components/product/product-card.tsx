import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { CatalogProduct } from "@/data/products";
import { formatCurrency } from "@/lib/money";
import { ProductVisual } from "./product-visual";
import { StockBadge } from "./stock-badge";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const isAvailable = product.stockStatus !== "No disponible";

  return (
    <article className="flex h-full flex-col rounded-md border border-border bg-card p-4 shadow-[0_10px_26px_rgba(18,50,74,0.05)]">
      <Link
        href={`/product/${product.slug}`}
        className="relative flex h-36 items-center justify-center overflow-hidden rounded-md bg-muted"
      >
        <ProductVisual seed={product.sku} />
        <span className="absolute left-3 top-3">
          <StockBadge status={product.stockStatus} />
        </span>
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-xs font-bold uppercase text-success">{product.category}</p>
        <Link href={`/product/${product.slug}`} className="mt-2 min-h-10 text-base font-bold leading-5">
          {product.name}
        </Link>
        <p className="mt-2 min-h-5 text-sm text-muted-foreground">
          {product.brand} · {product.partNumber}
        </p>
        <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{product.compatibility}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-xl font-bold text-primary">{formatCurrency(product.priceCents)}</span>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white disabled:bg-muted disabled:text-muted-foreground"
            disabled={!isAvailable}
            type="button"
          >
            <ShoppingCart className="h-4 w-4" />
            {isAvailable ? "Agregar" : "No disponible"}
          </button>
        </div>
      </div>
    </article>
  );
}
