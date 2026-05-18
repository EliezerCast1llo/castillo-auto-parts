import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle, ShoppingCart, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { StockBadge } from "@/components/product/stock-badge";
import { SiteHeader } from "@/components/site-header";
import { getProductBySlug, getRelatedProducts, mockProducts } from "@/data/mock-products";
import { formatCurrency } from "@/lib/money";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return mockProducts.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

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
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/catalog" className="text-sm font-semibold text-primary">
          Volver al catalogo
        </Link>

        <section className="mt-5 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <div className="flex min-h-[360px] items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-muted-foreground">
              Galeria de imagenes
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <h2 className="text-lg font-semibold text-primary">Descripcion</h2>
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

          <aside className="h-fit rounded-md border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{product.category}</p>
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

            <div className="mt-5 grid gap-3">
              <label className="text-sm font-semibold">
                Cantidad
                <select className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                </select>
              </label>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                <ShoppingCart className="h-4 w-4" />
                Agregar al carrito
              </button>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary">
                <MessageCircle className="h-4 w-4" />
                Validar con asesor
              </button>
            </div>

            <div className="mt-5 rounded-md bg-background p-4 text-sm text-muted-foreground">
              <div className="flex gap-2 font-semibold text-foreground">
                <Truck className="h-4 w-4 text-success" />
                Retiro en bodega o envio local
              </div>
              <p className="mt-2">
                Entrega inicial en San Salvador y Santa Tecla. La tarifa final se validara en
                checkout.
              </p>
            </div>

            <div className="mt-5">
              <h2 className="text-base font-semibold text-primary">Detalles tecnicos</h2>
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
