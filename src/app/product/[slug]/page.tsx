import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle, ShoppingCart, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { StockBadge } from "@/components/product/stock-badge";
import { SiteHeader } from "@/components/site-header";
import { addCartItem } from "@/app/cart/actions";
import {
  getCatalogProductBySlug,
  getCatalogProductSlugs,
  getRelatedCatalogProducts,
} from "@/data/products";
import { formatCurrency } from "@/lib/money";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return getCatalogProductSlugs();
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    return {
      title: "Producto no encontrado | Castillo Auto Parts",
    };
  }

  return {
    title: `${product.name} | Castillo Auto Parts`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedCatalogProducts(product);
  const isAvailable = product.stockStatus !== "No disponible";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/catalog" className="text-sm font-semibold text-primary">
          Volver al catálogo
        </Link>

        <section className="mt-5 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <div className="rounded-md border border-border bg-card p-4">
              <ProductGallery
                images={product.images}
                productName={product.name}
                productSku={product.sku}
              />
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-primary">Descripción</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{product.description}</p>
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-primary">Compatibilidad</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {product.compatibleVehicles.map((vehicle) => (
                  <div
                    key={vehicle}
                    className="flex min-h-11 items-center gap-2 rounded-md bg-background px-3 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {vehicle}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-md border border-border bg-card p-5 shadow-[0_16px_40px_rgba(18,50,74,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-success">{product.category}</p>
                <h1 className="mt-1 text-2xl font-bold text-primary">{product.name}</h1>
              </div>
              <StockBadge status={product.stockStatus} />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="Marca" value={product.brand} />
              <InfoItem label="Parte" value={product.partNumber} />
              <InfoItem label="SKU" value={product.sku} />
              <InfoItem label="Stock" value={`${product.stockQuantity} unidades`} />
            </dl>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-sm font-semibold text-muted-foreground">Precio con IVA incluido</p>
              <p className="mt-1 text-3xl font-bold text-primary">
                {formatCurrency(product.priceCents)}
              </p>
            </div>

            <form action={addCartItem} className="mt-5 grid gap-3">
              <input name="sku" type="hidden" value={product.sku} />
              <label className="text-sm font-semibold">
                Cantidad
                <div className="mt-2">
                  <QuantityStepper disabled={!isAvailable} max={product.stockQuantity} />
                </div>
              </label>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:bg-muted disabled:text-muted-foreground"
                disabled={!isAvailable}
              >
                <ShoppingCart className="h-4 w-4" />
                {isAvailable ? "Agregar al carrito" : "No disponible"}
              </button>
            </form>

            <div className="mt-3 grid gap-3">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary"
                type="button"
              >
                <MessageCircle className="h-4 w-4" />
                Validar con asesor
              </button>
            </div>

            <div className="mt-5 rounded-md bg-background p-4 text-sm text-muted-foreground">
              <div className="flex gap-2 font-semibold text-foreground">
                <Truck className="h-4 w-4 text-success" />
                Retiro en bodega o envío local
              </div>
              <p className="mt-2">
                Entrega inicial en San Salvador y Santa Tecla. La tarifa final se validará al pagar.
              </p>
            </div>

            <div className="mt-5">
              <h2 className="text-base font-semibold text-primary">Detalles técnicos</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {product.technicalDetails.map((detail) => (
                  <li key={detail} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-primary">Productos relacionados</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map((item) => (
                <ProductCard key={item.sku} product={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background p-3">
      <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
