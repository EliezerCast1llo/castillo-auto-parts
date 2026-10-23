import { normalizeCartSku } from "./cart-validation";
import { describe, expect, it } from "vitest";
import { isValidCatalogSku, normalizeCatalogSku, SKU_FORMAT_MESSAGE } from "./product-sku";
import { CSV_COLUMNS, exportCsv, parseCatalogCsv } from "./catalog-csv";

describe("shared SKU format", () => {
  it.each(["QA-FIL/03", "ab.c_1", " qa-fil/03 ", "a b.c_1", "A".repeat(64)])("accepts the same valid SKU in editor validation and CSV (%#)", (sku) => {
    const source = exportCsv([CSV_COLUMNS, [sku, "Filtro", "Marca", "", "Filtros", "12.00", "5", "", "", "", "", "", ""]]);
    expect(isValidCatalogSku(sku)).toBe(true);
    expect(parseCatalogCsv(source)).toMatchObject({ errors: [], rows: [expect.objectContaining({ sku: normalizeCatalogSku(sku) })] });
  });
  it.each(["ABC#1", "AÑO-1", "añ o-1", "ß-FIL", "_ABC", "", "  ", "A".repeat(65)])("rejects the same invalid SKU in editor validation and CSV (%#)", (sku) => {
    const source = exportCsv([CSV_COLUMNS, [sku, "Filtro", "Marca", "", "Filtros", "12.00", "5", "", "", "", "", "", ""]]);
    expect(isValidCatalogSku(sku)).toBe(false);
    expect(parseCatalogCsv(source).errors).toContainEqual(expect.objectContaining({ column: "sku" }));
  });
  it("cart still enforces the shared size limit and preserves its case/whitespace behavior", () => {
    expect(normalizeCartSku("a".repeat(64))).toBe("a".repeat(64));
    expect(normalizeCartSku("a".repeat(65))).toBe("");
    expect(normalizeCartSku(" ab.C-1 ")).toBe("ab.C-1");
    expect(normalizeCartSku("ab C-1")).toBe("");
  });
  it("explains the allowed ASCII characters and the shared size limit", () => {
    for (const text of ["A-Z sin tildes", "números", "punto", "guion", "barra", "64"]) expect(SKU_FORMAT_MESSAGE).toContain(text);
  });
});
