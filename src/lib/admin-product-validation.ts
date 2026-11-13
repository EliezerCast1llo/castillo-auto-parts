import { InventoryStatus } from "@prisma/client";
import { parseAdminPriceCents, parseCompatibilityLines } from "./admin-products";
import { formString } from "./form-utils";
import { parsePackageMeasurements } from "./package-measurements";

/** Field-specific feedback for creation; never throw away the submitted form. */
export function adminProductFieldErrors(data: FormData) {
  const errors: Record<string, string> = {};
  const read = (key: string) => formString(data, key);
  for (const [key, label] of [["name", "Nombre"], ["brand", "Marca"]]) {
    if (!read(key)) errors[key] = `${label}: completa este campo.`;
  }
  if (!read("categoryId") && !read("newCategoryName")) errors.categoryId = "Categoría: selecciona una o escribe una nueva.";
  if (parseAdminPriceCents(read("price")) === null) errors.price = "Precio: indica un importe válido con hasta dos decimales.";
  for (const key of ["quantityOnHand", "reorderPoint"]) {
    if (!/^\d+$/.test(read(key)) || !Number.isSafeInteger(Number(read(key)))) errors[key] = `${key === "quantityOnHand" ? "Stock" : "Punto de reposición"}: indica un entero mayor o igual que cero.`;
  }
  if (!Object.values(InventoryStatus).includes(read("status") as InventoryStatus)) errors.status = "Estado de inventario: selecciona una opción válida.";
  if (parseCompatibilityLines(read("compatibilities")).invalidLines.length) errors.compatibilities = "Compatibilidades: revisa marca, modelo y rango de años.";
  const keys = ["weightKg", "lengthCm", "widthCm", "heightCm"];
  const labels = ["Peso", "Largo", "Ancho", "Alto"];
  const measurements = parsePackageMeasurements(keys.map(read));
  if (measurements.errors.length || (read("isActive") === "true" && !measurements.values)) {
    keys.forEach((key, index) => { errors[key] = `${labels[index]}: completa las cuatro medidas con valores positivos válidos para activar el producto.`; });
  }
  return errors;
}
