import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import {
  ProductImageManager,
  type ProductImageData,
} from "@/components/admin/product-image-manager";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { updateAdminProduct } from "../../actions";
import { defaultLocale } from "@/lib/i18n/config";
import { adminSkuConflictMessage } from "@/lib/admin-products";
import { SKU_FORMAT_MESSAGE } from "@/lib/product-sku";

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
  const adminUser = await requireAdminRole("ADMIN");

  const query = searchParams ? await searchParams : {};
  const actionStatus = firstValue(query.estado);
  const statusMessage = getStatusMessage(actionStatus, firstValue(query.sku_existente));
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
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        translations: { where: { locale: "en" } },
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
      <SiteHeader locale={defaultLocale} />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <ArrowLeft className="h-4 w-4" />
              Volver a productos
            </Link>
            <h1 className="mt-5 text-2xl font-bold text-primary">{product.name}</h1>
          </div>
          <AdminNav active="products" user={adminUser} />
        </div>

        {statusMessage ? <AdminProductNotice isError={!["created", "updated"].includes(actionStatus)} message={statusMessage} /> : null}

        <section className="mt-5 space-y-4">
          {/* Se enumeran los campos en vez de esparcir el registro entero.
              El formulario es un componente de cliente, y el registro trae
              `Decimal` de Prisma —`ivaRate`— que no se puede serializar para
              cruzar esa frontera: Next avisa y el valor llega deformado. Lo que
              el formulario no declara, no viaja. */}
          <AdminProductForm
            action={updateAdminProduct}
            categories={categories}
            product={{
              brand: product.brand,
              categoryId: product.categoryId,
              compatibilities: product.compatibilities.map((item) => ({
                make: item.make,
                model: item.model,
                yearFrom: item.yearFrom,
                yearTo: item.yearTo,
              })),
              description: product.description,
              heightMm: product.heightMm,
              id: product.id,
              inventoryStocks: product.inventoryStocks.map((stock) => ({
                quantityOnHand: stock.quantityOnHand,
                reorderPoint: stock.reorderPoint,
                status: stock.status,
              })),
              isActive: product.isActive,
              isDemo: product.isDemo,
              isFeatured: product.isFeatured,
              lengthMm: product.lengthMm,
              name: product.name,
              partNumber: product.partNumber,
              priceCents: product.priceCents,
              shortDescription: product.shortDescription,
              sku: product.sku,
              slug: product.slug,
              technicalDetails: product.technicalDetails,
              translationEn: product.translations[0] ?? null,
              weightGrams: product.weightGrams,
              widthMm: product.widthMm,
            }}
            submitLabel="Guardar producto"
          />
          {/* Gestión de imágenes — solo disponible en edición, requiere product.id existente */}
          <ProductImageManager
            productId={product.id}
            initialImages={product.images.map(
              (img): ProductImageData => ({
                id: img.id,
                url: img.url,
                alt: img.alt ?? product.name,
                isPrimary: img.isPrimary,
                sortOrder: img.sortOrder,
              }),
            )}
          />
        </section>
      </div>
    </main>
  );
}

function AdminProductNotice({ message, isError }: { message: string; isError: boolean }) {
  return (
    <div role={isError ? "alert" : "status"} className={`mt-5 rounded-md p-3 text-sm font-semibold ${isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
      {message}
    </div>
  );
}

function getStatusMessage(status: string, existingSku: string) {
  if (status === "sku_conflict") return adminSkuConflictMessage(existingSku);
  const messages: Record<string, string> = {
    created: "Producto creado.",
    // El producto sí quedó guardado: lo que falló fue alguna imagen. Se dice
    // así de explícito porque el siguiente paso es distinto —reintentar la
    // subida acá abajo— y no "volver a crear el producto".
    created_images_failed:
      "Producto creado, pero alguna imagen no se pudo subir. Vuelve a agregarla aquí abajo.",
    db_unavailable: "No se pudo guardar el producto. Revisa PostgreSQL.",
    duplicate: "Ya existe un producto con ese SKU o slug.",
    invalid: "Revisa los campos. Para activar el producto completa peso, largo, ancho y alto; sin medidas puedes guardarlo como borrador.",
    invalid_sku: `Primero corrige el SKU para guardar este u otros cambios. ${SKU_FORMAT_MESSAGE}`,
    updated: "Producto actualizado.",
    conflict: "El catálogo cambió mientras guardabas. Revisa los datos y vuelve a intentarlo.",
  };

  return messages[status] ?? "";
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
