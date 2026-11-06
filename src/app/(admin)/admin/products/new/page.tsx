import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { SiteHeader } from "@/components/site-header";
import { requireAdminRole } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { createAdminProduct } from "../actions";
import { defaultLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";


export const metadata = {
  title: "Nuevo producto | Castillo Auto Parts",
};

export default async function NewAdminProductPage() {
  const adminUser = await requireAdminRole("ADMIN");

  const categories = await db.productCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

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
            <h1 className="mt-5 text-2xl font-bold text-primary">Nuevo producto</h1>
          </div>
          <AdminNav active="products" user={adminUser} />
        </div>

        <section className="mt-5">
          <AdminProductForm
            action={createAdminProduct}
            categories={categories}
            submitLabel="Crear producto"
          />
        </section>
      </div>
    </main>
  );
}
