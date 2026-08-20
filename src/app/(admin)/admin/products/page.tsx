import type { InventoryStatus } from "@prisma/client";
import { AlertTriangle, ArrowRight, Package, Plus, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { formatCurrency } from "@/lib/money";
import { db } from "@/lib/db";
import { updateAdminProductInventory } from "./actions";
import { defaultLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

type AdminProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const inventoryStatusOptions: InventoryStatus[] = [
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "PREORDER",
];

export const metadata = {
  title: "Admin productos | Castillo Auto Parts",
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const adminUser = await requireAdminRole("ADMIN", "MARKETING");

  const params = searchParams ? await searchParams : {};
  const query = firstValue(params.q);
  const status = parseInventoryStatus(firstValue(params.estado));
  const actionStatus = firstValue(params.estado_accion) || firstValue(params.estado);
  const statusMessage = getStatusMessage(actionStatus);
  const where = buildProductWhere(query, status);

  const [products, totalProducts, activeProducts, stockAlerts, stockTotal] = await Promise.all([
    db.product.findMany({
      include: {
        category: true,
        inventoryStocks: {
          include: { location: true },
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 80,
      where,
    }),
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.product.count({
      where: {
        inventoryStocks: {
          some: {
            status: { in: ["LOW_STOCK", "OUT_OF_STOCK", "PREORDER"] },
          },
        },
      },
    }),
    db.inventoryStock.aggregate({ _sum: { quantityOnHand: true } }),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={defaultLocale} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-md border border-border bg-card p-5">
          <p className="text-sm font-semibold text-success">Admin protegido</p>
          <div className="mt-1 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-bold text-primary">Productos e inventario</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Gestiona el catálogo operativo y la disponibilidad de la bodega principal.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <AdminNav active="products" user={adminUser} />
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white"
                href="/admin/products/new"
              >
                <Plus className="h-4 w-4" />
                Nuevo producto
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Productos" value={String(totalProducts)} />
          <MetricCard label="Activos" value={String(activeProducts)} />
          <MetricCard label="Alertas" value={String(stockAlerts)} />
          <MetricCard label="Unidades" value={String(stockTotal._sum.quantityOnHand ?? 0)} />
        </section>

        {statusMessage ? (
          <AdminProductsNotice isError={isErrorStatus(actionStatus)} message={statusMessage} />
        ) : null}

        <section className="mt-5 rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-primary">Filtros</h2>
          </div>
          <ProductFilterForm query={query} status={status} />
        </section>

        <section className="mt-5 rounded-md border border-border bg-card shadow-ca-card">
          <div className="flex items-center gap-2 border-b border-border p-5">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-primary">Catálogo admin</h2>
          </div>

          {products.length > 0 ? (
            <div className="divide-y divide-border">
              {products.map((product) => {
                const stock = product.inventoryStocks[0];

                return (
                  <article className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_420px_110px]" key={product.id}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className="text-lg font-bold text-primary"
                          href={`/admin/products/${product.slug}/edit`}
                        >
                          {product.name}
                        </Link>
                        <InventoryBadge status={stock?.status ?? "OUT_OF_STOCK"} />
                        {!product.isActive ? (
                          <span className="rounded-md bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                            Inactivo
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {product.brand} · {product.sku} · {product.partNumber ?? "Sin número de parte"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.category.name} · {formatCurrency(product.priceCents)} · Bodega{" "}
                        {stock?.location.code ?? "MAIN"}
                      </p>
                    </div>

                    <QuickStockForm
                      productId={product.id}
                      quantityOnHand={stock?.quantityOnHand ?? 0}
                      reorderPoint={stock?.reorderPoint ?? 2}
                      status={stock?.status ?? "OUT_OF_STOCK"}
                    />

                    <Link
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white xl:self-center"
                      href={`/admin/products/${product.slug}/edit`}
                    >
                      Editar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyProducts />
          )}
        </section>
      </div>
    </main>
  );
}

function ProductFilterForm({
  query,
  status,
}: {
  query: string;
  status?: InventoryStatus;
}) {
  return (
    <form className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_120px]" method="GET">
      <label className="block text-sm font-semibold">
        Buscar
        <div className="mt-2 flex h-11 items-center gap-2 rounded-md border border-border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            defaultValue={query}
            name="q"
            placeholder="Nombre, SKU, marca o número de parte"
          />
        </div>
      </label>
      <label className="block text-sm font-semibold">
        Estado
        <select
          className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          defaultValue={status ?? ""}
          name="estado"
        >
          <option value="">Todos</option>
          {inventoryStatusOptions.map((option) => (
            <option key={option} value={option}>
              {formatInventoryStatus(option)}
            </option>
          ))}
        </select>
      </label>
      <button className="mt-auto inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
        Filtrar
      </button>
    </form>
  );
}

function QuickStockForm({
  productId,
  quantityOnHand,
  reorderPoint,
  status,
}: {
  productId: string;
  quantityOnHand: number;
  reorderPoint: number;
  status: InventoryStatus;
}) {
  return (
    <form action={updateAdminProductInventory} className="grid gap-3 sm:grid-cols-[90px_100px_1fr_90px]">
      <input name="productId" type="hidden" value={productId} />
      <AdminNumberInput defaultValue={quantityOnHand} label="Cantidad" name="quantityOnHand" />
      <AdminNumberInput defaultValue={reorderPoint} label="Alerta" name="reorderPoint" />
      <label className="block text-sm font-semibold">
        Estado
        <select
          className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          defaultValue={status}
          name="status"
        >
          {inventoryStatusOptions.map((option) => (
            <option key={option} value={option}>
              {formatInventoryStatus(option)}
            </option>
          ))}
        </select>
      </label>
      <button className="mt-auto inline-flex h-10 items-center justify-center rounded-md border border-primary bg-card px-3 text-sm font-semibold text-primary">
        Guardar
      </button>
    </form>
  );
}

function AdminNumberInput({
  defaultValue,
  label,
  name,
}: {
  defaultValue: number;
  label: string;
  name: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        defaultValue={defaultValue}
        min="0"
        name={name}
        required
        type="number"
      />
    </label>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function InventoryBadge({ status }: { status: InventoryStatus }) {
  const className = getInventoryStatusClassName(status);

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold ${className}`}>
      {formatInventoryStatus(status)}
    </span>
  );
}

function AdminProductsNotice({ isError, message }: { isError: boolean; message: string }) {
  return (
    <div
      className={`mt-5 rounded-md p-3 text-sm font-semibold ${
        isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
      }`}
    >
      {message}
    </div>
  );
}

function EmptyProducts() {
  return (
    <div className="p-8 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-primary" />
      <h3 className="mt-4 text-lg font-bold text-primary">No hay productos para estos filtros</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Ajusta la búsqueda o crea un producto nuevo para el catálogo.
      </p>
    </div>
  );
}

function buildProductWhere(query: string, status?: InventoryStatus) {
  const filters = [];

  if (query) {
    filters.push({
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { brand: { contains: query, mode: "insensitive" as const } },
        { sku: { contains: query, mode: "insensitive" as const } },
        { partNumber: { contains: query, mode: "insensitive" as const } },
      ],
    });
  }

  if (status) {
    filters.push({
      inventoryStocks: {
        some: { status },
      },
    });
  }

  return filters.length > 0 ? { AND: filters } : undefined;
}

function parseInventoryStatus(status: string) {
  return inventoryStatusOptions.find((option) => option === status);
}

function getInventoryStatusClassName(status: InventoryStatus) {
  if (status === "IN_STOCK") return "bg-success/10 text-success";
  if (status === "LOW_STOCK") return "bg-warning/10 text-warning";
  if (status === "PREORDER") return "bg-primary/10 text-primary";
  return "bg-danger/10 text-danger";
}

function formatInventoryStatus(status: InventoryStatus) {
  const labels: Record<InventoryStatus, string> = {
    IN_STOCK: "Disponible",
    LOW_STOCK: "Últimas unidades",
    OUT_OF_STOCK: "No disponible",
    PREORDER: "Preorden",
  };

  return labels[status];
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    db_unavailable: "No se pudo guardar el producto. Revisa PostgreSQL.",
    duplicate: "Ya existe un producto con ese SKU o slug.",
    invalid: "Revisa los datos del producto.",
    not_found: "No encontramos ese producto.",
    stock_updated: "Inventario actualizado.",
  };

  return messages[status] ?? "";
}

function isErrorStatus(status: string) {
  return ["db_unavailable", "duplicate", "invalid", "not_found"].includes(status);
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
