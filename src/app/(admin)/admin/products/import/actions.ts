"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdminRole } from "@/lib/admin-auth";
import { formString } from "@/lib/form-utils";
import { MAX_CSV_BYTES, type CsvIssue } from "@/lib/catalog-csv";
import { previewCatalogImport as prepare, commitCatalogImport, CatalogImportError, type CatalogImportPlan } from "@/lib/catalog-import";
import { signImportPreview, verifyImportPreview } from "@/lib/catalog-import-proof";
import { CATALOG_CACHE_TAG, productCacheTag } from "@/data/products";
import { revalidateStorefrontPath } from "@/lib/i18n/revalidate";

export type CatalogImportState =
  | { kind: "error"; message: string; errors?: CsvIssue[] }
  | { kind: "preview"; source: string; deactivateDemo: boolean; proof: string | null; plan: CatalogImportPlan }
  | { kind: "success"; created: number; updated: number; deactivated: number; notice?: string };

export async function previewCsvImport(form: FormData): Promise<CatalogImportState> {
  const actor = await requireAdminRole("ADMIN");
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { kind: "error", message: "Selecciona un archivo CSV UTF-8." };
  if (file.size > MAX_CSV_BYTES) return { kind: "error", message: "El archivo supera 256 KiB. Divide el catálogo en lotes de hasta 200 productos." };
  let source: string;
  try { source = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()); }
  catch { return { kind: "error", message: "No se pudo leer el archivo. Guárdalo como CSV UTF-8." }; }
  const deactivateDemo = formString(form, "deactivateDemo") === "true";
  try {
    const plan = await prepare(source, deactivateDemo, actor);
    const proof = plan.errors.length ? null : signImportPreview({ source, deactivateDemo, adminId: actor.id, revision: plan.revision }, process.env.ADMIN_ACCESS_SECRET || "");
    return { kind: "preview", source, deactivateDemo, plan, proof };
  } catch {
    return { kind: "error", message: "No se pudo preparar la vista previa. Revisa la conexión y vuelve a intentarlo." };
  }
}

export async function confirmCsvImport(form: FormData): Promise<CatalogImportState> {
  const actor = await requireAdminRole("ADMIN");
  const source = typeof form.get("source") === "string" ? form.get("source") as string : "";
  if (new TextEncoder().encode(source).byteLength > MAX_CSV_BYTES) return { kind: "error", message: "El archivo supera 256 KiB." };
  const deactivateDemo = formString(form, "deactivateDemo") === "true";
  const revision = verifyImportPreview({ source, deactivateDemo, adminId: actor.id, proof: formString(form, "proof") }, process.env.ADMIN_ACCESS_SECRET || "");
  if (revision === null) return { kind: "error", message: "La vista previa venció o no coincide con este archivo. Valida el CSV de nuevo." };
  let result: Awaited<ReturnType<typeof commitCatalogImport>>;
  try { result = await commitCatalogImport(source, deactivateDemo, revision, actor); }
  catch (error) { return { kind: "error", message: error instanceof CatalogImportError ? error.message : "No se pudo importar el lote. Valida el archivo de nuevo." }; }
  try {
    updateTag(CATALOG_CACHE_TAG);
    for (const slug of new Set(result.slugs)) {
      updateTag(productCacheTag(slug));
      revalidateStorefrontPath(`/product/${slug}`);
      revalidatePath(`/admin/products/${slug}/edit`);
    }
    revalidateStorefrontPath("/"); revalidateStorefrontPath("/catalog");
    revalidatePath("/admin/products");
  } catch {
    return { kind: "success", ...result, notice: "El lote se guardó, pero no se pudo refrescar el catálogo público. Revisa la caché antes de publicar." };
  }
  return { kind: "success", created: result.created, updated: result.updated, deactivated: result.deactivated };
}
