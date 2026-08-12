import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { CatalogProduct, CatalogProductsResult } from "@/data/products";

type FeaturedProductsProps = {
  catalogStatus: CatalogProductsResult["status"];
  products: CatalogProduct[];
};

export function FeaturedProducts({ catalogStatus, products }: FeaturedProductsProps) {
  return (
    <section className="animate-fade-up delay-200 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-ca-gold-400" />
          <div>
            <h2
              className="font-display text-2xl font-black tracking-[0.01em] text-ca-navy-950"
            >
              Productos destacados
            </h2>
          </div>
        </div>
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ca-blue-700 transition hover:text-ca-navy-950"
          href="/catalog"
        >
          Ver todos
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {products.slice(0, 4).map((product, i) => (
            <div
              key={product.sku}
              className="animate-scale-in"
              style={{ animationDelay: `${0.25 + i * 0.08}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-ca-border bg-white p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-ca-navy-950/[0.07] text-ca-navy-900">
              <PackageSearch className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-black text-ca-navy-950">
                {catalogStatus === "unavailable"
                  ? "Catálogo temporalmente no disponible"
                  : "Sin productos destacados"}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ca-text-secondary">
                {catalogStatus === "unavailable"
                  ? "No pudimos cargar inventario real. No mostramos datos de prueba cuando la base de datos no responde."
                  : "Aún no hay productos destacados activos para mostrar en Home."}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
