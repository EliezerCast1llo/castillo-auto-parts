import { canonicalizeVehicle } from "@/data/vehicle-catalog";
import { parseAdminPriceCents } from "./admin-products";
import { slugifyValue } from "./slug";
import { parsePackageMeasurements, type PackageMeasurements } from "./package-measurements";
import { isValidCatalogSku, normalizeCatalogSku, SKU_FORMAT_MESSAGE } from "./product-sku";
export { normalizeCatalogSku, SKU_WHITESPACE } from "./product-sku";

export const MAX_CSV_BYTES = 256 * 1024;
export const MAX_CSV_ROWS = 200;
export const CSV_COLUMNS = ["sku", "nombre", "marca", "numero_parte", "categoria", "precio_iva", "stock", "descripcion", "peso_kg", "largo_cm", "ancho_cm", "alto_cm", "compatibilidades"] as const;
export type CsvIssue = { row: number; column: string; message: string };
export type CatalogCsvRow = {
  row: number; sku: string; name: string; brand: string; partNumber: string | null;
  category: string; categorySlug: string; priceCents: number; stock: number; description: string | null;
  measurements: PackageMeasurements | null;
  compatibilities: Array<{ make: string; model: string; yearFrom: number; yearTo: number }>;
};

/** RFC 4180 quoting, including embedded newlines, with comma or Excel semicolon. */
function readRecords(source: string, delimiter: string): string[][] {
  const separator = delimiter === ";" ? "punto y coma" : "comas";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false, closed = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') { cell += '"'; index += 1; }
        else { quoted = false; closed = true; }
      } else cell += char;
    } else if (char === delimiter) {
      row.push(cell); cell = ""; closed = false;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = ""; closed = false;
    } else if (char === '"' && cell === "" && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error(`Comillas CSV inválidas. Encierra entre comillas los textos con ${separator} y duplica las comillas interiores. Exporta como CSV UTF-8.`);
      cell += char;
    }
    if (rows.length > MAX_CSV_ROWS + 1) throw new Error(`El lote admite hasta ${MAX_CSV_ROWS} filas.`);
  }
  if (quoted) throw new Error(`Hay un campo entre comillas sin cerrar. Revisa el CSV separado por ${separator}.`);
  if (cell || row.length || closed) { row.push(cell); rows.push(row); }
  return rows;
}

export function parseCatalogCsv(input: string): { rows: CatalogCsvRow[]; errors: CsvIssue[] } {
  const errors: CsvIssue[] = [], rows: CatalogCsvRow[] = [];
  const fileError = (message: string) => ({ rows, errors: [{ row: 1, column: "archivo", message }] });
  if (new TextEncoder().encode(input).byteLength > MAX_CSV_BYTES) return fileError("El archivo supera 256 KiB.");
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(input)) return fileError("El archivo contiene caracteres de control no válidos.");
  let records: string[][];
  const source = input.replace(/^\uFEFF/, "");
  const firstLine = source.split(/\r?\n/, 1)[0];
  const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  const separator = delimiter === ";" ? "punto y coma" : "comas";
  try { records = readRecords(source, delimiter); }
  catch (error) { return fileError((error as Error).message); }
  const header = records.shift()?.map((cell) => cell.trim().toLowerCase()) || [];
  if (header.length !== CSV_COLUMNS.length || new Set(header).size !== header.length || CSV_COLUMNS.some((column) => !header.includes(column))) {
    return fileError(`Usa exactamente las columnas de la plantilla: ${CSV_COLUMNS.join(", ")}.`);
  }
  const skus = new Set<string>();
  records.forEach((record, index) => {
    if (record.every((cell) => !cell.trim())) return;
    const row = index + 2, initialErrors = errors.length;
    const issue = (column: string, message: string) => errors.push({ row, column, message });
    if (record.length !== header.length) { issue("archivo", `La cantidad de columnas no coincide con la plantilla. Encierra entre comillas los textos con ${separator}.`); return; }
    const get = (column: string) => record[header.indexOf(column)].trim();
    const sku = normalizeCatalogSku(get("sku")), name = get("nombre"), brand = get("marca"), category = get("categoria");
    for (const [column, value, max] of [["sku", sku, 64], ["nombre", name, 200], ["marca", brand, 100], ["categoria", category, 100]] as const) {
      if (!value || value.length > max) issue(column, `Es obligatorio y admite hasta ${max} caracteres.`);
    }
    if (!isValidCatalogSku(get("sku"))) issue("sku", SKU_FORMAT_MESSAGE);
    if (skus.has(sku)) issue("sku", "SKU repetido dentro del mismo archivo.");
    skus.add(sku);
    const categorySlug = slugifyValue(category);
    if (!categorySlug) issue("categoria", "La categoría debe contener letras o números.");
    const priceCents = parseAdminPriceCents(get("precio_iva"));
    if (priceCents === null || priceCents <= 0 || priceCents > 2_147_483_647) issue("precio_iva", "Indica un precio USD con IVA mayor que cero, hasta dos decimales y sin separadores de miles.");
    const stock = Number(get("stock"));
    if (!/^\d+$/.test(get("stock")) || !Number.isSafeInteger(stock) || stock > 2_147_483_647) issue("stock", "Indica unidades enteras desde 0 hasta 2147483647.");
    for (const [column, max] of [["numero_parte", 100], ["descripcion", 5000]] as const) if (get(column).length > max) issue(column, `Admite hasta ${max} caracteres.`);
    const measurements = parsePackageMeasurements([get("peso_kg"), get("largo_cm"), get("ancho_cm"), get("alto_cm")]);
    measurements.errors.forEach((error) => issue(error.column, error.message));
    const compatibilities: CatalogCsvRow["compatibilities"] = [];
    const entries = get("compatibilidades") ? get("compatibilidades").split(";") : [];
    if (entries.length > 20) issue("compatibilidades", "Admite hasta 20 compatibilidades por producto.");
    for (const entry of entries.slice(0, 20)) {
      const parts = entry.split("|").map((part) => part.trim());
      const [make, model, from, to] = parts;
      if (parts.length !== 4 || !make || !model || make.length > 100 || model.length > 100 || !/^\d{4}$/.test(from) || !/^\d{4}$/.test(to) || Number(from) < 1900 || Number(to) > 2100 || Number(from) > Number(to)) {
        issue("compatibilidades", "Usa Marca|Modelo|AñoDesde|AñoHasta; años de 1900 a 2100 y desde ≤ hasta."); continue;
      }
      const item = { ...canonicalizeVehicle({ make, model }), yearFrom: Number(from), yearTo: Number(to) };
      if (!compatibilities.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) compatibilities.push(item);
    }
    if (initialErrors === errors.length) rows.push({ row, sku, name, brand, category, categorySlug, priceCents: priceCents!, stock, partNumber: get("numero_parte") || null, description: get("descripcion") || null, measurements: measurements.values, compatibilities });
  });
  if (!records.some((record) => record.some((cell) => cell.trim()))) return fileError("Añade al menos un producto a la plantilla.");
  if (rows.length > MAX_CSV_ROWS) return fileError(`El lote admite hasta ${MAX_CSV_ROWS} filas.`);
  return { rows, errors };
}

/** Neutralize spreadsheet formulas, then apply CSV escaping (including newlines). */
export function exportCsv(records: readonly (readonly string[])[]) {
  return "\uFEFF" + records.map((row) => row.map((raw) => {
    const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(raw) || /^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n") + "\r\n";
}
