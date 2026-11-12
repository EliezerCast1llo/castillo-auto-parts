import { expect, it } from "vitest";
import { adminProductFieldErrors } from "./admin-product-validation";
const valid = () => { const data = new FormData(); for (const [key, value] of Object.entries({ name: "Filtro", brand: "Toyota", categoryId: "category", price: "10.50", quantityOnHand: "2", reorderPoint: "1", status: "IN_STOCK", isActive: "true", weightKg: "1", lengthCm: "20", widthCm: "10", heightCm: "5" })) data.set(key, value); return data; };
it("accepts a complete form", () => { expect(adminProductFieldErrors(valid())).toEqual({}); });
it.each(["name", "brand", "categoryId", "price", "quantityOnHand", "reorderPoint", "status"])("identifies %s without misleading measurement feedback", (field) => {
  const data = valid(); data.set(field, "");
  expect(Object.keys(adminProductFieldErrors(data))).toEqual([field]);
});
it("accepts a new category and an inactive draft without dimensions", () => {
  const data = valid(); data.set("categoryId", ""); data.set("newCategoryName", "Nueva"); data.set("isActive", "false");
  for (const key of ["weightKg", "lengthCm", "widthCm", "heightCm"]) data.set(key, "");
  expect(adminProductFieldErrors(data)).toEqual({});
});
it("requires complete dimensions on active products", () => {
  const data = valid(); data.set("weightKg", "");
  expect(adminProductFieldErrors(data)).toHaveProperty("weightKg");
});
