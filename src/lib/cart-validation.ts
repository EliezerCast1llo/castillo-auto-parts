import { isValidCatalogSku } from "./product-sku";
export const CART_MAX_LINE_QUANTITY = 99;
export const CART_MAX_SKU_LENGTH = 64;

export function normalizeCartSku(value: string) {
  const sku = value.trim();

  if (sku !== sku.replace(/\s+/g, "") || !isValidCatalogSku(sku)) {
    return "";
  }

  return sku;
}

export function sanitizeCartQuantity(value: number, maxQuantity = CART_MAX_LINE_QUANTITY) {
  if (!Number.isFinite(value)) return 0;

  const safeMaxQuantity = Math.max(0, Math.trunc(maxQuantity));
  const quantity = Math.max(0, Math.trunc(value));

  return Math.min(quantity, CART_MAX_LINE_QUANTITY, safeMaxQuantity);
}

export function hasValidCartActionInput(sku: string, quantity: number) {
  return Boolean(normalizeCartSku(sku)) && sanitizeCartQuantity(quantity) > 0;
}
