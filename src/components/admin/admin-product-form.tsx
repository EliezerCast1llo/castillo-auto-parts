import type { InventoryStatus, ProductCategory } from "@prisma/client";
import { Save } from "lucide-react";
import { CompatibilityEditor } from "@/components/admin/compatibility-editor";
import { formatAdminPriceInput } from "@/lib/admin-products";
import { SKU_FORMAT_MESSAGE } from "@/lib/product-sku";

type AdminProductFormProduct = {
  brand: string;
  categoryId: string;
  compatibilities: Array<{
    make: string;
    model: string;
    yearFrom: number;
    yearTo: number;
  }>;
  description: string | null;
  id: string;
  inventoryStocks: Array<{
    quantityOnHand: number;
    reorderPoint: number;
    status: InventoryStatus;
  }>;
  isActive: boolean;
  isFeatured: boolean;
  isDemo?: boolean;
  name: string;
  partNumber: string | null;
  priceCents: number;
  shortDescription: string | null;
  translationEn: { name: string | null; shortDescription: string | null; description: string | null } | null;
  sku: string;
  slug: string;
  technicalDetails: unknown;
  weightGrams?: number | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
};

type AdminProductFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: ProductCategory[];
  product?: AdminProductFormProduct;
  submitLabel: string;
};

const inventoryStatusOptions: Array<{ label: string; value: InventoryStatus }> = [
  { label: "Disponible", value: "IN_STOCK" },
  { label: "Últimas unidades", value: "LOW_STOCK" },
  { label: "No disponible", value: "OUT_OF_STOCK" },
  { label: "Preorden", value: "PREORDER" },
];

export function AdminProductForm({
  action,
  categories,
  product,
  submitLabel,
}: AdminProductFormProps) {
  const stock = product?.inventoryStocks[0];

  return (
    <form action={action} className="space-y-4">
      {product ? <input name="productId" type="hidden" value={product.id} /> : null}

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Producto</h2>
        {product?.isDemo ? <p className="mt-2 text-sm text-warning">Producto de demostración. Guardar esta ficha lo marcará como real y lo excluirá de la limpieza de demo.</p> : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <AdminTextField defaultValue={product?.name} label="Nombre" name="name" required />
          <AdminTextField defaultValue={product?.slug} label="Slug" name="slug" />
          <AdminTextField defaultValue={product?.brand} label="Marca" name="brand" required />
          <div>
            <AdminTextField aria-describedby="admin-product-sku-help" defaultValue={product?.sku} label="SKU" name="sku" required />
            <p id="admin-product-sku-help" className="mt-1 text-xs text-muted-foreground">{SKU_FORMAT_MESSAGE} No puede coincidir con otro producto.</p>
          </div>
          <AdminTextField
            defaultValue={product?.partNumber ?? ""}
            label="Número de parte"
            name="partNumber"
          />
          <AdminTextField
            defaultValue={product ? formatAdminPriceInput(product.priceCents) : ""}
            label="Precio USD"
            name="price"
            required
            step="0.01"
            type="number"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            Categoría
            <select
              className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
              defaultValue={product?.categoryId ?? ""}
              name="categoryId"
            >
              <option value="">Seleccionar</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <AdminTextField label="Nueva categoría" name="newCategoryName" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-md bg-background p-3 text-sm font-semibold">
            <input
              className="h-4 w-4 accent-primary"
              defaultChecked={product?.isActive ?? true}
              name="isActive"
              type="checkbox"
              value="true"
            />
            Activo
          </label>
          <label className="flex items-center gap-3 rounded-md bg-background p-3 text-sm font-semibold">
            <input
              className="h-4 w-4 accent-primary"
              defaultChecked={product?.isFeatured ?? false}
              name="isFeatured"
              type="checkbox"
              value="true"
            />
            Destacado
          </label>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Inventario</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AdminTextField
            defaultValue={String(stock?.quantityOnHand ?? 0)}
            label="Cantidad"
            min="0"
            name="quantityOnHand"
            required
            type="number"
          />
          <AdminTextField
            defaultValue={String(stock?.reorderPoint ?? 2)}
            label="Alerta desde"
            min="0"
            name="reorderPoint"
            required
            type="number"
          />
          <label className="block text-sm font-semibold">
            Estado
            <select
              className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
              defaultValue={stock?.status ?? "OUT_OF_STOCK"}
              name="status"
            >
              {inventoryStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Peso y medidas del paquete</h2>
        <p className="mt-2 text-sm text-muted-foreground">Completa los cuatro valores para preparar la cotización de envíos. Sin ellos no se podrá cotizar con Boxful.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <AdminTextField label="Peso (kg)" name="weightKg" type="number" min="0.001" step="0.001" defaultValue={product?.weightGrams ? String(product.weightGrams / 1000) : ""} />
          <AdminTextField label="Largo (cm)" name="lengthCm" type="number" min="0.1" step="0.1" defaultValue={product?.lengthMm ? String(product.lengthMm / 10) : ""} />
          <AdminTextField label="Ancho (cm)" name="widthCm" type="number" min="0.1" step="0.1" defaultValue={product?.widthMm ? String(product.widthMm / 10) : ""} />
          <AdminTextField label="Alto (cm)" name="heightCm" type="number" min="0.1" step="0.1" defaultValue={product?.heightMm ? String(product.heightMm / 10) : ""} />
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Detalle</h2>
        <div className="mt-4 space-y-4">
          <AdminTextarea
            defaultValue={product?.shortDescription ?? ""}
            label="Descripción corta"
            name="shortDescription"
            rows={2}
          />
          <AdminTextarea
            defaultValue={product?.description ?? ""}
            label="Descripción"
            name="description"
            rows={4}
          />
          <AdminTextarea
            defaultValue={formatTechnicalDetails(product?.technicalDetails)}
            label="Detalles técnicos"
            name="technicalDetails"
            rows={4}
          />
          <CompatibilityEditor defaultCompatibilities={product?.compatibilities ?? []} />
        </div>
      </section>

      {/* El panel admin es interno y va en español; lo que se edita acá es el
          contenido que ve el cliente. Los campos vacíos caen al español, campo
          por campo: se puede traducir solo el nombre y dejar la descripción. */}
      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-primary">Traducción al inglés (opcional)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lo que dejes vacío se muestra en español dentro del sitio en inglés.
        </p>
        <div className="mt-4 space-y-4">
          <AdminTextField
            defaultValue={product?.translationEn?.name ?? ""}
            label="Nombre en inglés"
            name="nameEn"
          />
          <AdminTextarea
            defaultValue={product?.translationEn?.shortDescription ?? ""}
            label="Descripción corta en inglés"
            name="shortDescriptionEn"
            rows={2}
          />
          <AdminTextarea
            defaultValue={product?.translationEn?.description ?? ""}
            label="Descripción en inglés"
            name="descriptionEn"
            rows={4}
          />
        </div>
      </section>

      <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white">
        <Save className="h-4 w-4" />
        {submitLabel}
      </button>
    </form>
  );
}

function AdminTextField({
  defaultValue,
  label,
  name,
  required,
  type = "text",
  ...props
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
        defaultValue={defaultValue}
        name={name}
        required={required}
        type={type}
        {...props}
      />
    </label>
  );
}

function AdminTextarea({
  defaultValue,
  label,
  name,
  rows,
}: {
  defaultValue: string;
  label: string;
  name: string;
  rows: number;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        defaultValue={defaultValue}
        name={name}
        rows={rows}
      />
    </label>
  );
}

function formatTechnicalDetails(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join("\n")
    : "";
}

