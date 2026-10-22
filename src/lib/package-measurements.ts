export const PACKAGE_COLUMNS = ["peso_kg", "largo_cm", "ancho_cm", "alto_cm"] as const;
export type PackageMeasurements = { weightGrams: number; lengthMm: number; widthMm: number; heightMm: number };

/** CSV and the product editor share units and precision; no floating point storage. */
export function parsePackageMeasurements(values: string[]) {
  if (values.every((value) => !value.trim())) return { values: null, errors: [] };
  const errors: Array<{ column: string; message: string }> = [];
  const parsed = values.map((value, index) => {
    const normalized = value.trim().replace(",", ".");
    const decimals = index === 0 ? 3 : 1;
    const valid = new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`).test(normalized);
    const amount = Number(normalized);
    if (!valid || amount <= 0 || amount > 1000) {
      errors.push({ column: PACKAGE_COLUMNS[index], message: `Indica un valor mayor que 0 y hasta 1000, con hasta ${decimals} decimales. Completa las cuatro medidas.` });
    }
    return Math.round(amount * (index === 0 ? 1000 : 10));
  });
  return {
    values: errors.length ? null : { weightGrams: parsed[0], lengthMm: parsed[1], widthMm: parsed[2], heightMm: parsed[3] },
    errors,
  };
}
