import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Wrench,
} from "lucide-react";
import { CategoryRail } from "@/components/home/category-rail";
import { HomeHero } from "@/components/home/home-hero";
import { CatalogActiveFilters } from "@/components/product/catalog-active-filters";
import { CatalogFilterForm } from "@/components/product/catalog-filter-form";
import { PopularSearches } from "@/components/product/popular-searches";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductVisual } from "@/components/product/product-visual";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { StockBadge } from "@/components/product/stock-badge";
import { VehicleSearchPanel } from "@/components/product/vehicle-search-panel";
import {
  countActiveCatalogFilters,
  getCatalogFilterOptions,
  type CatalogFilters,
} from "@/data/catalog-filters";
import { mockProducts } from "@/data/mock-products";
import { formatCurrency } from "@/lib/money";

const sampleProduct = mockProducts[0];
const relatedProducts = mockProducts.slice(1, 4);
const filterOptions = getCatalogFilterOptions(mockProducts);
const sampleFilters: CatalogFilters = {
  query: "Toyota Corolla",
  categories: ["Filtros"],
  brands: [sampleProduct.brand],
  stockStatuses: ["Disponible"],
  vehicleMake: "Toyota",
  vehicleModel: "Corolla",
  vehicleYear: "2018",
};

export const metadata = {
  title: "UI Kit | Castillo Auto Parts",
  description: "Componentes visuales implementables para el MVP.",
};

export default function DesignPreviewPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PreviewHeader />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <DesignSection
          eyebrow="Sistema visual"
          title="Componentes reales para implementar"
          description="Esta ruta sirve como laboratorio vivo: aquí revisamos UI real con Tailwind y componentes del proyecto antes de llevar cambios a las pantallas productivas."
        >
          <ComponentFoundation />
        </DesignSection>

        <DesignSection
          eyebrow="Home"
          title="Entrada sin filtros"
          description="Home orienta, genera confianza y manda al catálogo. Los filtros viven únicamente en Catálogo."
        >
          <div className="space-y-5">
            <HomeHero />
            <PopularSearches />
            <CategoryRail />
          </div>
        </DesignSection>

        <DesignSection
          eyebrow="Catálogo"
          title="Búsqueda, filtros y resultados"
          description="El catálogo es la pantalla de decisión: vehículo, filtros activos, cards uniformes, stock y compatibilidad."
        >
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-4">
              <CatalogFilterForm key="design-filters">
                <VehicleSearchPanel filters={sampleFilters} options={filterOptions} />
                <ProductFilters
                  activeFilterCount={countActiveCatalogFilters(sampleFilters)}
                  filters={sampleFilters}
                  options={filterOptions}
                />
              </CatalogFilterForm>
            </aside>
            <section className="space-y-4">
              <CatalogToolbar />
              <CatalogActiveFilters filters={sampleFilters} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {mockProducts.slice(0, 6).map((product) => (
                  <ProductCard key={product.sku} product={product} />
                ))}
              </div>
            </section>
          </div>
        </DesignSection>

        <DesignSection
          eyebrow="Producto"
          title="Detalle con compatibilidad primero"
          description="La ficha debe responder rápido si la pieza funciona, cuánto cuesta, cuántas unidades hay y cómo pedir ayuda."
        >
          <ProductDetailPreview />
        </DesignSection>

        <DesignSection
          eyebrow="Carrito"
          title="Revisión antes de pagar"
          description="El carrito debe confirmar disponibilidad, cantidad, subtotal, envío y que los precios incluyen IVA."
        >
          <CartPreview />
        </DesignSection>
      </div>
    </main>
  );
}

function PreviewHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-success">UI kit MVP</p>
            <h1 className="text-xl font-bold text-primary">Castillo Auto Parts</h1>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          <a className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white" href="#catalogo">
            Componentes
          </a>
          <Link
            className="inline-flex h-10 items-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary"
            href="/"
          >
            Ver MVP
          </Link>
        </nav>
      </div>
    </header>
  );
}

function DesignSection({
  children,
  description,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="space-y-4" id={title === "Búsqueda, filtros y resultados" ? "catalogo" : undefined}>
      <div>
        <p className="text-sm font-semibold text-success">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold text-primary">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ComponentFoundation() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-md border border-border bg-card p-5">
        <p className="text-sm font-bold text-primary">Barra de búsqueda global</p>
        <div className="mt-4 grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_160px]">
          <label className="flex min-h-12 items-center gap-3 rounded-md bg-card px-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Busca por repuesto, SKU, número de parte o vehículo"
              type="search"
            />
          </label>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white">
            <Search className="h-4 w-4" />
            Buscar
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <FoundationTile icon={<ShieldCheck className="h-5 w-5" />} label="Pago en línea" />
          <FoundationTile icon={<Truck className="h-5 w-5" />} label="Entrega local" />
          <FoundationTile icon={<MapPin className="h-5 w-5" />} label="Retiro gratis" />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="text-sm font-bold text-primary">Botones y estados</p>
        <div className="mt-4 grid gap-3">
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white">
            <ShoppingCart className="h-4 w-4" />
            Acción primaria
          </button>
          <button className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary">
            Acción secundaria
          </button>
          <div className="flex flex-wrap gap-2">
            <StockBadge status="Disponible" />
            <StockBadge status="Últimas unidades" />
            <StockBadge status="No disponible" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FoundationTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-md border border-border bg-background px-3 text-sm font-semibold">
      <span className="text-success">{icon}</span>
      {label}
    </div>
  );
}

function CatalogToolbar() {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-md border border-border bg-card p-5 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold text-success">Inventario inicial</p>
        <h3 className="mt-1 text-2xl font-bold text-primary">Catálogo de repuestos</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Comparación rápida por compatibilidad, disponibilidad y precio.
        </p>
      </div>
      <div className="inline-flex w-fit items-center gap-2 rounded-md bg-background px-3 py-2 text-sm font-bold text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        6 de {mockProducts.length} productos
      </div>
    </div>
  );
}

function ProductDetailPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <div className="grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-[92px_1fr]">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-1">
            {[0, 1, 2, 3].map((item) => (
              <div className="flex aspect-square items-center justify-center rounded-md bg-background" key={item}>
                <ProductVisual seed={`${sampleProduct.sku}-${item}`} />
              </div>
            ))}
          </div>
          <div className="flex min-h-80 items-center justify-center rounded-md bg-background p-8">
            <ProductVisual seed={sampleProduct.sku} />
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <h3 className="text-lg font-bold text-primary">Compatibilidad</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sampleProduct.compatibleVehicles.map((vehicle) => (
              <div className="flex min-h-12 items-center gap-2 rounded-md bg-background px-3 text-sm font-semibold" key={vehicle}>
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
            <p className="text-sm font-bold text-success">{sampleProduct.category}</p>
            <h3 className="mt-1 text-3xl font-bold leading-tight text-primary">{sampleProduct.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {sampleProduct.brand} · Parte {sampleProduct.partNumber}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">SKU {sampleProduct.sku}</p>
          </div>
          <StockBadge status={sampleProduct.stockStatus} />
        </div>

        <div className="mt-5 rounded-md bg-background p-4">
          <p className="text-sm font-semibold text-muted-foreground">Precio con IVA incluido</p>
          <p className="mt-1 text-4xl font-bold text-primary">{formatCurrency(sampleProduct.priceCents)}</p>
        </div>

        <div className="mt-5 grid gap-3">
          <label className="text-sm font-bold">
            Cantidad
            <span className="mt-2 block">
              <QuantityStepper max={sampleProduct.stockQuantity} />
            </span>
          </label>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white">
            <ShoppingCart className="h-4 w-4" />
            Agregar al carrito
          </button>
          <button className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-bold text-primary">
            ¿No estás seguro? Validar compatibilidad
          </button>
        </div>
      </aside>
    </div>
  );
}

function CartPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-3">
        {relatedProducts.map((product) => (
          <article className="grid gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-[120px_1fr]" key={product.sku}>
            <div className="flex h-32 items-center justify-center rounded-md bg-background">
              <ProductVisual seed={product.sku} />
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <p className="text-xs font-bold uppercase text-success">{product.category}</p>
                <h3 className="mt-1 text-lg font-bold text-primary">{product.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.brand} · SKU {product.sku}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{product.compatibility}</p>
              </div>
              <div className="grid gap-3">
                <StockBadge status={product.stockStatus} />
                <QuantityStepper defaultValue={1} max={product.stockQuantity} />
                <p className="text-lg font-bold text-primary">{formatCurrency(product.priceCents)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-md border border-border bg-card p-5 shadow-[0_16px_40px_rgba(18,50,74,0.08)]">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-primary">Resumen</h3>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <SummaryRow label="Productos" value="3 unidades" />
          <SummaryRow label="Envío" value="Se define en checkout" />
          <SummaryRow label="Total estimado" value="$54.85" strong />
        </dl>
        <div className="mt-4 rounded-md bg-primary/5 p-3 text-sm font-semibold text-primary">
          Los precios ya incluyen IVA.
        </div>
        <div className="mt-4 grid gap-2 rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 font-semibold text-primary">
            <CreditCard className="h-4 w-4" />
            Pago completo en línea
          </p>
          <p className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-success" />
            Retiro o envío se elige en checkout
          </p>
        </div>
        <button className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
          Continuar al checkout
        </button>
      </aside>
    </div>
  );
}

function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "text-xl font-bold text-primary" : "font-semibold"}>{value}</dd>
    </div>
  );
}
