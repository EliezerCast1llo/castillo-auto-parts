export const CART_MAX_LINE_QUANTITY = 99;
export const CART_MAX_SKU_LENGTH = 64;

const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

export function normalizeCartSku(value: string) {
  const sku = value.trim();

  if (!sku || sku.length > CART_MAX_SKU_LENGTH || !SKU_PATTERN.test(sku)) {
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
