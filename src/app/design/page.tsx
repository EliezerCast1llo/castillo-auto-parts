import Link from "next/link";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronDown,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Truck,
  Wrench,
} from "lucide-react";
import { mockProducts } from "@/data/mock-products";
import { formatCurrency } from "@/lib/money";
import { QuantityStepper } from "@/components/product/quantity-stepper";

const featuredProduct = mockProducts[0];
const relatedProducts = mockProducts.slice(1, 4);

export const metadata = {
  title: "Diseño materializado | Castillo Auto Parts",
  description: "Propuesta visual materializada para catálogo y detalle de producto.",
};

export default function DesignPreviewPage() {
  return (
    <main className="min-h-screen bg-[#F6F7F9] text-[#111827]">
      <PreviewHeader />
      <CatalogDesign />
      <ProductDesign />
    </main>
  );
}

function PreviewHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#D8DEE6] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#16803C]">
            Propuesta visual materializada
          </p>
          <h1 className="text-xl font-bold text-[#1F2933]">Catálogo y producto</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          <a
            className="inline-flex h-10 items-center rounded-md bg-[#0B5CAD] px-4 text-sm font-semibold text-white"
            href="#catalogo"
          >
            Ver catálogo
          </a>
          <a
            className="inline-flex h-10 items-center rounded-md border border-[#D8DEE6] bg-white px-4 text-sm font-semibold text-[#1F2933]"
            href="#producto"
          >
            Ver producto
          </a>
          <Link
            className="inline-flex h-10 items-center rounded-md border border-[#D8DEE6] bg-white px-4 text-sm font-semibold text-[#1F2933]"
            href="/catalog"
          >
            Volver al MVP
          </Link>
        </nav>
      </div>
    </header>
  );
}

function CatalogDesign() {
  return (
    <section id="catalogo" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8">
      <DesignFrame>
        <StoreTopBar />

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[300px_1fr] lg:p-8">
          <aside className="space-y-4">
            <VehicleFinder />
            <FilterPanel />
          </aside>

          <section className="space-y-5">
            <CatalogHero />

            <div className="flex flex-col gap-3 rounded-md border border-[#D8DEE6] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#16803C]">
                  Inventario inicial
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#1F2933]">Catálogo de repuestos</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#56616F]">
                  Filtros visibles, compatibilidad clara y stock antes de abrir el detalle.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-md bg-[#F6F7F9] px-3 py-2 text-sm font-bold text-[#1F2933]">
                <SlidersHorizontal className="h-4 w-4" /> 6 productos
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mockProducts.map((product, index) => (
                <DesignProductCard key={product.sku} index={index} product={product} />
              ))}
            </div>
          </section>
        </div>
      </DesignFrame>
    </section>
  );
}

function ProductDesign() {
  return (
    <section id="producto" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-12 sm:px-6 lg:px-8">
      <DesignFrame>
        <StoreTopBar />

        <div className="p-4 sm:p-6 lg:p-8">
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#1F2933]" href="/catalog">
            Catálogo <ArrowRight className="h-4 w-4" /> Filtro de aceite Toyota
          </Link>

          <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
            <div className="space-y-5">
              <div className="grid gap-3 rounded-md border border-[#D8DEE6] bg-white p-4 sm:grid-cols-[96px_1fr]">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-1">
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      className="flex aspect-square items-center justify-center rounded-md border border-[#D8DEE6] bg-[#F6F7F9]"
                      key={item}
                    >
                      <ProductVisual variant={item} />
                    </div>
                  ))}
                </div>
                <div className="flex min-h-[360px] items-center justify-center rounded-md bg-[#F6F7F9] p-8">
                  <ProductVisual large variant={0} />
                </div>
              </div>

              <InfoBand />

              <DetailSection
                title="Descripción"
                body="Filtro de aceite para mantenimiento preventivo en motores Toyota 1.8L y aplicaciones compatibles por catálogo. La compatibilidad se valida antes de compra para evitar errores por versión o motor."
              />

              <section className="rounded-md border border-[#D8DEE6] bg-white p-5">
                <h2 className="text-lg font-bold text-[#1F2933]">Compatibilidad</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {featuredProduct.compatibleVehicles.map((vehicle) => (
                    <div
                      className="flex min-h-12 items-center gap-2 rounded-md bg-[#F6F7F9] px-3 text-sm font-semibold text-[#111827]"
                      key={vehicle}
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16803C]" />
                      {vehicle}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-md border border-[#D8DEE6] bg-white p-5 shadow-[0_16px_40px_rgba(18,50,74,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#16803C]">{featuredProduct.category}</p>
                  <h2 className="mt-1 text-3xl font-bold leading-tight text-[#1F2933]">
                    {featuredProduct.name}
                  </h2>
                  <p className="mt-2 text-sm text-[#56616F]">
                    {featuredProduct.brand} · Parte {featuredProduct.partNumber}
                  </p>
                </div>
                <StockPill status={featuredProduct.stockStatus} />
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Spec label="SKU" value={featuredProduct.sku} />
                <Spec label="Stock" value={`${featuredProduct.stockQuantity} unidades`} />
                <Spec label="Zona" value="SS / Santa Tecla" />
                <Spec label="IVA" value="Incluido" />
              </dl>

              <div className="mt-5 rounded-md bg-[#F6F7F9] p-4">
                <p className="text-sm font-semibold text-[#56616F]">Precio con IVA incluido</p>
                <p className="mt-1 text-4xl font-bold text-[#1F2933]">
                  {formatCurrency(featuredProduct.priceCents)}
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                <label className="text-sm font-bold text-[#1F2933]">
                  Cantidad
                  <div className="mt-2">
                    <QuantityStepper max={featuredProduct.stockQuantity} />
                  </div>
                </label>
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#0B5CAD] px-4 text-sm font-bold text-white">
                  <ShoppingCart className="h-4 w-4" />
                  Agregar al carrito
                </button>
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#D8DEE6] bg-white px-4 text-sm font-bold text-[#1F2933]">
                  <MessageCircle className="h-4 w-4" />
                  Validar con asesor
                </button>
              </div>

              <div className="mt-5 rounded-md border border-[#D8DEE6] bg-[#F6F7F9] p-4 text-sm text-[#56616F]">
                <div className="flex gap-2 font-bold text-[#1F2933]">
                  <Truck className="h-4 w-4 text-[#16803C]" />
                  Retiro en bodega o envío local
                </div>
                <p className="mt-2">
                  Retiro gratis o envío inicial en San Salvador y Santa Tecla. Tarifa final al pagar.
                </p>
              </div>
            </aside>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-bold text-[#1F2933]">Productos relacionados</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {relatedProducts.map((product, index) => (
                <DesignProductCard compact index={index + 1} key={product.sku} product={product} />
              ))}
            </div>
          </section>
        </div>
      </DesignFrame>
    </section>
  );
}

function StoreTopBar() {
  return (
    <div className="border-b border-[#D8DEE6] bg-white">
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1F2933] text-white">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#1F2933]">Castillo Auto Parts</p>
            <p className="text-xs font-semibold text-[#56616F]">Repuestos para El Salvador</p>
          </div>
        </div>

        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-[#D8DEE6] bg-[#F6F7F9] px-3 lg:max-w-xl">
          <Search className="h-4 w-4 text-[#56616F]" />
          <span className="text-sm text-[#56616F]">Buscar por nombre, SKU o número de parte</span>
        </div>

        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0B5CAD] px-4 text-sm font-bold text-white">
          <ShoppingCart className="h-4 w-4" />
          Carrito
        </button>
      </div>
    </div>
  );
}

function CatalogHero() {
  return (
    <div className="overflow-hidden rounded-md bg-[#1F2933] text-white">
      <div className="grid gap-4 p-5 md:grid-cols-[1fr_260px] md:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F59E0B]">
            Compra con compatibilidad clara
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight">
            Encuentra el repuesto correcto antes de pagar
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">
            Busca por vehículo, categoría, marca o número de parte. Stock y precio visibles desde la lista.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <TrustChip icon={<ShieldCheck className="h-4 w-4" />} label="Pago online seguro" />
            <TrustChip icon={<MapPin className="h-4 w-4" />} label="San Salvador y Santa Tecla" />
          </div>
        </div>
        <div className="flex items-center justify-center rounded-md bg-white/10 p-4">
          <div className="grid w-full gap-2">
            <MiniMetric label="Productos iniciales" value="50-80" />
            <MiniMetric label="IVA" value="13% incluido" />
            <MiniMetric label="Retiro" value="Gratis" />
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleFinder() {
  return (
    <section className="rounded-md border border-[#D8DEE6] bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <Car className="h-5 w-5 text-[#1F2933]" />
        <h2 className="text-base font-bold text-[#1F2933]">Busca por vehículo</h2>
      </div>
      <div className="space-y-3">
        {["Toyota", "Corolla", "2018"].map((value) => (
          <div
            className="flex h-11 items-center justify-between rounded-md border border-[#D8DEE6] bg-[#F6F7F9] px-3 text-sm font-semibold text-[#111827]"
            key={value}
          >
            {value}
            <ChevronDown className="h-4 w-4 text-[#56616F]" />
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterPanel() {
  return (
    <section className="rounded-md border border-[#D8DEE6] bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-[#1F2933]" />
        <h2 className="text-base font-bold text-[#1F2933]">Filtros</h2>
      </div>

      <div className="flex h-11 items-center gap-2 rounded-md border border-[#D8DEE6] bg-[#F6F7F9] px-3">
        <Search className="h-4 w-4 text-[#56616F]" />
        <span className="text-sm text-[#56616F]">Filtro aceite Toyota</span>
      </div>

      <FilterGroup title="Categoría" values={["Filtros", "Frenos", "Bujías"]} />
      <FilterGroup title="Marca" values={["WIX", "NGK", "Bosch"]} />
      <FilterGroup title="Disponibilidad" values={["Disponible", "Últimas unidades", "No disponible"]} />

      <button className="mt-5 h-11 w-full rounded-md bg-[#0B5CAD] text-sm font-bold text-white">
        Buscar
      </button>
    </section>
  );
}

function FilterGroup({ title, values }: { title: string; values: string[] }) {
  return (
    <fieldset className="mt-5 space-y-2">
      <legend className="mb-2 text-sm font-bold text-[#1F2933]">{title}</legend>
      {values.map((value, index) => (
        <label className="flex items-center gap-2 text-sm text-[#111827]" key={value}>
          <span
            className={`h-4 w-4 rounded border ${
              index === 0 ? "border-[#0B5CAD] bg-[#0B5CAD]" : "border-[#D8DEE6] bg-white"
            }`}
          />
          {value}
        </label>
      ))}
    </fieldset>
  );
}

function DesignProductCard({
  compact = false,
  index,
  product,
}: {
  compact?: boolean;
  index: number;
  product: (typeof mockProducts)[number];
}) {
  return (
    <article className="group flex h-full flex-col rounded-md border border-[#D8DEE6] bg-white p-4 shadow-[0_10px_26px_rgba(18,50,74,0.05)]">
      <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-md bg-[#F6F7F9]">
        <ProductVisual variant={index} />
        <div className="absolute left-3 top-3">
          <StockPill status={product.stockStatus} />
        </div>
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#16803C]">
          {product.category}
        </p>
        <h3 className="mt-2 min-h-10 text-base font-bold leading-5 text-[#1F2933]">{product.name}</h3>
        <p className="mt-2 min-h-5 text-sm text-[#56616F]">
          {product.brand} · {product.partNumber}
        </p>
        {!compact ? (
          <p className="mt-2 min-h-10 text-sm leading-5 text-[#56616F]">{product.compatibility}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-xl font-bold text-[#1F2933]">{formatCurrency(product.priceCents)}</span>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0B5CAD] px-3 text-sm font-bold text-white">
            <ShoppingCart className="h-4 w-4" />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductVisual({ large = false, variant }: { large?: boolean; variant: number }) {
  const colors = [
    "from-[#DCE7EC] via-white to-[#BFD0D8]",
    "from-[#E3E7EA] via-white to-[#B9C1C6]",
    "from-[#E8EDF0] via-white to-[#CDD9DE]",
    "from-[#E5ECEF] via-white to-[#BACBD3]",
  ];

  return (
    <div
      className={`relative ${large ? "h-64 w-64" : "h-24 w-28"} rounded-full bg-gradient-to-br ${
        colors[variant % colors.length]
      } shadow-inner`}
    >
      <div className="absolute left-1/2 top-1/2 h-[56%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-[#1F2933]/85 bg-white shadow-lg" />
      <div className="absolute left-1/2 top-1/2 h-[30%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16803C]/85" />
      <div className="absolute bottom-[18%] left-[18%] h-3 w-[64%] rounded-full bg-[#1F2933]/15 blur-sm" />
    </div>
  );
}

function StockPill({ status }: { status: string }) {
  const styles =
    status === "Disponible"
      ? "bg-[#16803C] text-white"
      : status === "Últimas unidades"
        ? "bg-[#F59E0B] text-[#111827]"
        : "bg-[#E8EDF0] text-[#56616F]";

  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${styles}`}>{status}</span>;
}

function TrustChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-md bg-white/12 px-3 text-sm font-semibold text-white">
      {icon}
      {label}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs font-semibold text-[#56616F]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#1F2933]">{value}</p>
    </div>
  );
}

function InfoBand() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <SmallInfo icon={<ShieldCheck className="h-4 w-4" />} label="Compra protegida" />
      <SmallInfo icon={<Truck className="h-4 w-4" />} label="Retiro o envío local" />
      <SmallInfo icon={<Star className="h-4 w-4" />} label="Validación con asesor" />
    </div>
  );
}

function SmallInfo({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-md border border-[#D8DEE6] bg-white px-3 text-sm font-bold text-[#1F2933]">
      <span className="text-[#16803C]">{icon}</span>
      {label}
    </div>
  );
}

function DetailSection({ body, title }: { body: string; title: string }) {
  return (
    <section className="rounded-md border border-[#D8DEE6] bg-white p-5">
      <h2 className="text-lg font-bold text-[#1F2933]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#56616F]">{body}</p>
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#F6F7F9] p-3">
      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#56616F]">{label}</dt>
      <dd className="mt-1 font-bold text-[#111827]">{value}</dd>
    </div>
  );
}

function DesignFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-[#D8DEE6] bg-[#F6F7F9] shadow-[0_20px_70px_rgba(18,50,74,0.10)]">
      {children}
    </div>
  );
}
