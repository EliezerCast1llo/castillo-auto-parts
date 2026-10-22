import { describe, expect, it } from "vitest";
import { CSV_COLUMNS, exportCsv, MAX_CSV_BYTES, parseCatalogCsv } from "./catalog-csv";
import { parsePackageMeasurements } from "./package-measurements";

const base = ["CSV-001", "Filtro", "Marca", "P-1", "Filtros", "12.99", "5", 'Descripción, con "comillas"\ny segunda línea', "1.250", "20.5", "10", "5", "Toyota|Corolla|2010|2018;Honda|Civic|2016|2020"];
const csv = (rows: string[][]) => exportCsv([CSV_COLUMNS, ...rows]);

describe("catalog CSV", () => {
  it("roundtrips BOM, quoted commas, escaped quotes, Unicode and multiline fields", () => {
    const parsed = parseCatalogCsv(csv([base]));
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({ sku: "CSV-001", priceCents: 1299, stock: 5, description: base[7], measurements: { weightGrams: 1250, lengthMm: 205, widthMm: 100, heightMm: 50 } });
    expect(parsed.rows[0].compatibilities).toHaveLength(2);
  });
  it("accepts reordered headers and the semicolon separator used by Excel", () => {
    const headers = [...CSV_COLUMNS].reverse();
    const values = [...base].reverse(); values[0] = "Toyota|Corolla|2010|2018";
    const encode = (cells: readonly string[]) => cells.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";");
    // Header delimiter detection does not look into data cells.
    const parsed = parseCatalogCsv(`${encode(headers)}\r\n${encode(values)}`);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0].sku).toBe("CSV-001");
  });
  it.each([
    [0, "=CMD()", "sku"], [1, "", "nombre"], [2, "", "marca"], [4, "!!!", "categoria"],
    [5, "1.001", "precio_iva"], [5, "-1", "precio_iva"], [5, "0", "precio_iva"],
    [6, "-1", "stock"], [6, "1.5", "stock"], [6, "2147483648", "stock"],
    [8, "0", "peso_kg"], [9, "0.01", "largo_cm"],
    [12, "Toyota|Corolla|2020|2010", "compatibilidades"],
    [12, "Toyota|Corolla|2010|2020|motor", "compatibilidades"],
  ])("reports invalid cell in row and column (%s, %s)", (index, value, column) => {
    const row = [...base]; row[index as number] = value as string;
    // Don't sanitize input: this helper is testing the importer, not an export.
    const raw = [CSV_COLUMNS, row].map((cells) => cells.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    expect(parseCatalogCsv(raw).errors).toEqual(expect.arrayContaining([expect.objectContaining({ row: 2, column })]));
  });
  it("rejects duplicates, malformed quoting, unknown headers and mismatched rows", () => {
    expect(parseCatalogCsv(csv([base, base])).errors.some((error) => error.row === 3 && error.column === "sku")).toBe(true);
    expect(parseCatalogCsv(`${CSV_COLUMNS.join(",")}\n"unclosed`).errors[0].message).toContain("comillas");
    expect(parseCatalogCsv("sku,nombre\nONE,Producto").errors).not.toHaveLength(0);
    expect(parseCatalogCsv(`${CSV_COLUMNS.join(",")}\nONE,Producto`).errors[0].row).toBe(2);
    expect(parseCatalogCsv(exportCsv([CSV_COLUMNS])).errors[0].message).toContain("al menos");
  });
  it("limits both bytes and rows before any database access", () => {
    expect(parseCatalogCsv("á".repeat(MAX_CSV_BYTES)).errors[0].message).toContain("256");
    const rows = Array.from({ length: 201 }, (_, index) => { const row = [...base]; row[0] = `CSV-${index}`; return row; });
    expect(parseCatalogCsv(csv(rows)).errors[0].message).toContain("200");
  });
  it("does not guess or partially accept package measurements", () => {
    expect(parsePackageMeasurements(["", "", "", ""]).values).toBeNull();
    expect(parsePackageMeasurements(["1", "", "", ""]).errors).toHaveLength(3);
    expect(parsePackageMeasurements(["0,001", "0,1", "10", "10"]).values?.weightGrams).toBe(1);
  });
  it.each(["=1+1", "+SUM(A1)", "-1+2", "@cmd", "  =cmd", "\t=cmd", "\r=cmd", "\n=cmd"])("neutralizes formula-like export cells: %s", (value) => {
    expect(exportCsv([[value]])).toContain(`"'${value}"`);
  });
});
