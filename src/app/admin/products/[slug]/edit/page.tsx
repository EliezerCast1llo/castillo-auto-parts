import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { SiteHeader } from "@/components/site-header";
import { requireAdminAccess } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { updateAdminProduct } from "../../actions";

export const dynamic = "force-dynamic";

type EditAdminProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: EditAdminProductPageProps) {
  const { slug } = await params;

  return {
    title: `Editar ${slug} | Castillo Auto Parts`,
  };
}

export default async function EditAdminProductPage({
  params,
  searchParams,
}: EditAdminProductPageProps) {
  const { slug } = await params;
  await requireAdminAccess(`/admin/products/${slug}/edit`);

  const query = searchParams ? await searchParams : {};
  const statusMessage = getStatusMessage(firstValue(query.estado));
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      include: {
        compatibilities: {
          orderBy: [{ make: "asc" }, { model: "asc" }, { yearFrom: "asc" }],
        },
        inventoryStocks: {
          include: { location: true },
          orderBy: { updatedAt: "desc" },
        },
      },
      where: { slug },
    }),
    db.productCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <ArrowLeft className="h-4 w-4" />
              Volver a productos
            </Link>
            <h1 className="mt-5 text-2xl font-bold text-primary">{product.name}</h1>
          </div>
          <AdminNav active="products" />
        </div>

        {statusMessage ? <AdminProductNotice message={statusMessage} /> : null}

        <section className="mt-5">
          <AdminProductForm
            action={updateAdminProduct}
            categories={categories}
            product={product}
            submitLabel="Guardar producto"
          />
        </section>
      </div>
    </main>
  );
}

function AdminProductNotice({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">
      {message}
    </div>
  );
}

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    created: "Producto creado.",
    db_unavailable: "No se pudo guardar el producto. Revisa PostgreSQL.",
    duplicate: "Ya existe un producto con ese SKU o slug.",
    invalid: "Revisa los campos del producto.",
    updated: "Producto actualizado.",
  };

  return messages[status] ?? "";
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
