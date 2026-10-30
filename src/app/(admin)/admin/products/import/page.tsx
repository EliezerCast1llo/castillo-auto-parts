import Link from "next/link";
import { requireAdminRole } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { CatalogCsvImportForm } from "@/components/admin/catalog-csv-import-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Importar catálogo CSV | Castillo Auto Parts" };

export default async function CatalogCsvImportPage() {
  const adminUser = await requireAdminRole("ADMIN");
  return <main className="mx-auto max-w-7xl space-y-5 px-4 py-8 text-foreground">
    <Link className="text-sm font-semibold text-primary underline" href="/admin/products">Volver a productos</Link>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-primary">Importar catálogo por CSV</h1>
      <AdminNav active="products" user={adminUser} />
    </div>
    <section className="space-y-3 rounded-md border border-border bg-card p-5">
      <h2 className="text-lg font-bold text-primary">1. Prepara el archivo</h2>
      <a className="inline-flex rounded-md bg-primary px-4 py-3 font-semibold text-white" href="/api/admin/catalog-import-template" download>Descargar plantilla CSV</a>
      <p>CSV UTF-8, separado por comas o punto y coma. Máximo 256 KiB y 200 productos por lote. El SKU identifica cada producto sin distinguir mayúsculas ni espacios. Los choques existentes deben resolverse antes de importar.</p>
      <p>Precio en USD con IVA incluido; stock físico total en bodega MAIN, sin descontar las reservas. Peso en kg (hasta 3 decimales), medidas en cm (hasta 1 decimal).</p>
      <p>Compatibilidades: <code>Toyota|Corolla|2010|2018;Honda|Civic|2016|2020</code>. Sin motores; hasta 20 por producto.</p>
      <p className="text-sm text-muted-foreground">Descripción, número de parte, compatibilidades y medidas vacías conservan los valores de productos existentes. Para cambiarlos, proporciona valores; las medidas requieren las cuatro celdas. Se mantienen imágenes, traducciones, rutas y estado activo. Un producto inactivo seguirá inactivo: la vista previa lo advierte y puedes reactivarlo desde su ficha. Los nuevos se crean activos y requieren peso, largo, ancho y alto. También se rechazan actualizaciones de productos activos si faltan medidas; los borradores pueden conservarlas vacías.</p>
    </section>
    <CatalogCsvImportForm />
  </main>;
}
