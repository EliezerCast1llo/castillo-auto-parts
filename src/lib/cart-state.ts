export type StoredCartItem = {
  quantity: number;
  sku: string;
};

const MAX_GUEST_CART_ITEMS = 50;

export function parseStoredCart(value: string | undefined): StoredCartItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return normalizeCartItems(
      parsed
        .map((item) => ({
          quantity: Number(item?.quantity),
          sku: String(item?.sku ?? "").trim(),
        }))
        .filter((item) => item.sku && Number.isInteger(item.quantity) && item.quantity > 0),
    );
  } catch {
    return [];
  }
}

export function serializeStoredCart(items: StoredCartItem[]) {
  return JSON.stringify(normalizeCartItems(items));
}

export function upsertStoredCartItem(
  items: StoredCartItem[],
  sku: string,
  quantityToAdd: number,
  maxQuantity: number,
) {
  const cleanSku = sku.trim();
  const safeQuantityToAdd = sanitizeQuantity(quantityToAdd);
  const safeMaxQuantity = sanitizeQuantity(maxQuantity);
  if (!cleanSku || safeQuantityToAdd <= 0 || safeMaxQuantity <= 0) return normalizeCartItems(items);

  const currentQuantity = items.find((item) => item.sku === cleanSku)?.quantity ?? 0;
  return setStoredCartItemQuantity(items, cleanSku, currentQuantity + safeQuantityToAdd, safeMaxQuantity);
}

export function setStoredCartItemQuantity(
  items: StoredCartItem[],
  sku: string,
  quantity: number,
  maxQuantity: number,
) {
  const cleanSku = sku.trim();
  if (!cleanSku) return normalizeCartItems(items);

  const safeMaxQuantity = sanitizeQuantity(maxQuantity);
  const nextQuantity = Math.min(sanitizeQuantity(quantity), safeMaxQuantity);
  const otherItems = normalizeCartItems(items).filter((item) => item.sku !== cleanSku);

  if (nextQuantity <= 0) {
    return otherItems;
  }

  return normalizeCartItems([{ sku: cleanSku, quantity: nextQuantity }, ...otherItems]);
}

export function removeStoredCartItem(items: StoredCartItem[], sku: string) {
  const cleanSku = sku.trim();
  return normalizeCartItems(items).filter((item) => item.sku !== cleanSku);
}

export function getStoredCartQuantity(items: StoredCartItem[], sku: string) {
  return normalizeCartItems(items).find((item) => item.sku === sku)?.quantity ?? 0;
}

function normalizeCartItems(items: StoredCartItem[]) {
  const merged = new Map<string, number>();

  for (const item of items) {
    const sku = item.sku.trim();
    const quantity = sanitizeQuantity(item.quantity);
    if (!sku || quantity <= 0) continue;

    merged.set(sku, (merged.get(sku) ?? 0) + quantity);
  }

  return [...merged.entries()]
    .slice(0, MAX_GUEST_CART_ITEMS)
    .map(([sku, quantity]) => ({ sku, quantity }));
}

function sanitizeQuantity(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}
