import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { MockProduct } from "@/data/mock-products";
import { formatCurrency } from "@/lib/money";
import { StockBadge } from "./stock-badge";

export function ProductCard({ product }: { product: MockProduct }) {
  return (
    <article className="rounded-md border border-border bg-card p-4">
      <Link
        href={`/product/${product.slug}`}
        className="flex h-36 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground"
      >
        Imagen producto
      </Link>
      <div className="mt-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/product/${product.slug}`} className="text-base font-semibold leading-5">
            {product.name}
          </Link>
          <StockBadge status={product.stockStatus} />
        </div>
        <p className="text-sm text-muted-foreground">
          {product.brand} · {product.partNumber}
        </p>
        <p className="text-sm text-muted-foreground">{product.compatibility}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-primary">{formatCurrency(product.priceCents)}</span>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
            <ShoppingCart className="h-4 w-4" />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
