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
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-ca-navy-950">Productos destacados</h2>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-black text-ca-blue-700" href="/catalog">
          Ver todos los productos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-ca-border bg-white p-8 shadow-[var(--ca-shadow-soft)]">
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
