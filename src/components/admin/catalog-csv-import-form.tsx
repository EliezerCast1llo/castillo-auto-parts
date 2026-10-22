"use client";

import { useState, useTransition, type FormEvent } from "react";
import { previewCsvImport, confirmCsvImport, type CatalogImportState } from "@/app/(admin)/admin/products/import/actions";
import { MAX_CSV_BYTES } from "@/lib/catalog-csv";
import { formatCurrency } from "@/lib/money";

export function CatalogCsvImportForm() {
  const [state, setState] = useState<CatalogImportState | null>(null);
  const [fileError, setFileError] = useState("");
  const [pending, startTransition] = useTransition();
  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState(null);
    startTransition(async () => setState(await previewCsvImport(form)));
  }
  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state?.kind !== "preview" || !state.proof || state.plan.errors.length) return;
    const form = new FormData();
    form.set("source", state.source); form.set("proof", state.proof); form.set("deactivateDemo", String(state.deactivateDemo));
    startTransition(async () => setState(await confirmCsvImport(form)));
  }
  return <div className="space-y-5">
    <form onSubmit={preview} className="rounded-md border border-border bg-card p-5">
      <h2 className="text-lg font-bold text-primary">2. Valida y revisa</h2>
      <fieldset disabled={pending} className="mt-4 space-y-4">
        <label className="block font-semibold">Archivo CSV
          <input className="mt-2 block w-full rounded border border-border p-3 text-sm" name="file" type="file" accept=".csv,text/csv" required onChange={(event) => {
            setState(null);
            setFileError((event.currentTarget.files?.[0]?.size ?? 0) > MAX_CSV_BYTES ? "El archivo supera 256 KiB." : "");
          }} />
        </label>
        <label className="flex items-start gap-3 text-sm"><input className="mt-1" name="deactivateDemo" type="checkbox" value="true" onChange={() => setState(null)} />
          <span>Desactivar productos de demostración al confirmar. Solo se retirarán los marcados como demo que no aparezcan en este CSV. Los pedidos y sus referencias se conservan.</span>
        </label>
        {fileError ? <p role="alert" className="text-danger">{fileError}</p> : null}
        <button disabled={!!fileError || pending} className="rounded-md bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50" type="submit">{pending ? "Procesando…" : "Validar y ver vista previa"}</button>
      </fieldset>
    </form>
    {state?.kind === "error" ? <p role="alert" className="rounded-md bg-danger/10 p-4 text-danger">{state.message}</p> : null}
    {state?.kind === "success" ? <div role="status" className="rounded-md bg-success/10 p-4 text-success">
      <p>Importación completada: {state.created} creados, {state.updated} actualizados, {state.deactivated} productos de demo desactivados.</p>
      {state.notice ? <p>{state.notice}</p> : null}
    </div> : null}
    {state?.kind === "preview" ? <section className="space-y-4 rounded-md border border-border bg-card p-5">
      <h2 className="text-lg font-bold text-primary">3. Confirma la importación</h2>
      <p>No se ha guardado nada. Revisa todo el lote; la vista previa vence en 15 minutos.</p>
      {state.plan.errors.length ? <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
        <p className="font-bold">Corrige estos errores y vuelve a validar. No se puede importar el lote.</p>
        <ul className="mt-2 list-disc pl-5">{state.plan.errors.map((error, index) => <li key={index}>Fila {error.row} · {error.column}: {error.message}</li>)}</ul>
      </div> : null}
      {state.plan.items.length ? <>
        <p>{state.plan.items.filter((item) => item.action === "crear").length} productos nuevos; {state.plan.items.filter((item) => item.action === "actualizar").length} existentes.</p>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <caption className="sr-only">Vista previa de productos del CSV</caption>
          <thead><tr>{["Fila", "Producto", "Acción", "Precio con IVA", "Stock MAIN", "Detalles"].map((label) => <th className="border-b border-border p-2" key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{state.plan.items.map((item) => <tr key={item.source.row}>
            <td className="p-2">{item.source.row}</td><td className="p-2"><p className="font-semibold">{item.source.sku}</p><p>{item.source.name}</p></td>
            <td className="p-2"><p>{item.action}</p>
              <p>Cambios: {item.changes.join(", ") || "ninguno"}.</p>
              {item.isActive ? <p>Estado final: Activo.</p> : <p className="font-semibold text-warning">Estado final: Inactivo. Seguirá inactivo; reactívalo desde su ficha si debe aparecer en el catálogo.</p>}
              {item.existingSku && item.existingSku !== item.source.sku ? <p>SKU existente: {item.existingSku}</p> : null}
            </td><td className="p-2">{item.previousPrice !== null ? `${formatCurrency(item.previousPrice)} → ` : ""}{formatCurrency(item.source.priceCents)}</td>
            <td className="p-2">{item.previousStock !== null ? `${item.previousStock} → ` : ""}{item.source.stock}</td>
            <td className="p-2"><details><summary className="cursor-pointer font-semibold">Ver detalles de {item.source.sku}</summary>
              <p>Marca: {item.source.brand}. Categoría: {item.source.category}. Número de parte: {item.partNumber || "vacío"}{item.action === "actualizar" && !item.source.partNumber ? " (vacío en CSV: se conserva)" : ""}.</p>
              <p className="whitespace-pre-wrap">Descripción: {item.description || "vacía"}{item.action === "actualizar" && !item.source.description ? " (vacía en CSV: se conserva)" : ""}</p>
              <p>{item.measurements ? `${item.measurements.weightGrams / 1000} kg · ${item.measurements.lengthMm / 10} × ${item.measurements.widthMm / 10} × ${item.measurements.heightMm / 10} cm` : "Sin peso y medidas: pendiente para cotizar envíos."}</p>
              <p>Compatibilidades: {item.compatibilities.map((vehicle) => `${vehicle.make} ${vehicle.model} ${vehicle.yearFrom}–${vehicle.yearTo}`).join("; ") || "ninguna"}{item.action === "actualizar" && !item.source.compatibilities.length ? " (vacías en CSV: se conservan)" : ""}</p>
            </details></td>
          </tr>)}</tbody>
        </table></div>
      </> : null}
      {state.deactivateDemo ? <details><summary className="cursor-pointer font-semibold">Se desactivarán {state.plan.demo.length} productos de demo</summary>
        <ul>{state.plan.demo.map((product) => <li key={product.id}>{product.sku} · {product.name}</li>)}</ul>
      </details> : null}
      <form onSubmit={confirm}><button disabled={pending || !state.proof || state.plan.errors.length > 0} className="rounded-md bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50" type="submit">{pending ? "Importando…" : "Confirmar importación"}</button></form>
    </section> : null}
  </div>;
}
