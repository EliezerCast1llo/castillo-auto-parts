import { createHmac, timingSafeEqual } from "node:crypto";
import {
  CART_MAX_LINE_QUANTITY,
  normalizeCartSku,
  sanitizeCartQuantity,
} from "./cart-validation";

export type StoredCartItem = {
  quantity: number;
  sku: string;
};

const MAX_GUEST_CART_ITEMS = 50;
const SIGNED_CART_VERSION = "v1";

export type SignedCartParseOptions = {
  allowUnsignedFallback?: boolean;
};

export function parseStoredCart(value: string | undefined): StoredCartItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return normalizeCartItems(
      parsed
        .map((item) => ({
          quantity: Number(item?.quantity),
          sku: normalizeCartSku(String(item?.sku ?? "")),
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

export function parseSignedStoredCart(
  value: string | undefined,
  secret: string | string[],
  options: SignedCartParseOptions = {},
) {
  if (!value) return [];

  const signedCart = parseSignedCartValue(value);
  if (!signedCart) {
    return options.allowUnsignedFallback ? parseStoredCart(value) : [];
  }

  // Acepta varios secretos para permitir rotación sin invalidar cookies vivos:
  // se firma con el secreto primario pero se verifica contra todos los aceptados.
  const secrets = Array.isArray(secret) ? secret : [secret];
  const isValid = secrets.some((candidate) =>
    verifyCartSignature(signedCart.payload, signedCart.signature, candidate),
  );
  if (!isValid) return [];

  return parseStoredCart(decodeCartPayload(signedCart.payload));
}

export function serializeSignedStoredCart(items: StoredCartItem[], secret: string) {
  const payload = encodeCartPayload(serializeStoredCart(items));
  return `${SIGNED_CART_VERSION}.${payload}.${signCartPayload(payload, secret)}`;
}

export function upsertStoredCartItem(
  items: StoredCartItem[],
  sku: string,
  quantityToAdd: number,
  maxQuantity: number,
) {
  const cleanSku = normalizeCartSku(sku);
  const safeQuantityToAdd = sanitizeCartQuantity(quantityToAdd);
  const safeMaxQuantity = sanitizeCartQuantity(maxQuantity);
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
  const cleanSku = normalizeCartSku(sku);
  if (!cleanSku) return normalizeCartItems(items);

  const safeMaxQuantity = sanitizeCartQuantity(maxQuantity);
  const nextQuantity = sanitizeCartQuantity(quantity, safeMaxQuantity);
  const otherItems = normalizeCartItems(items).filter((item) => item.sku !== cleanSku);

  if (nextQuantity <= 0) {
    return otherItems;
  }

  return normalizeCartItems([{ sku: cleanSku, quantity: nextQuantity }, ...otherItems]);
}

export function removeStoredCartItem(items: StoredCartItem[], sku: string) {
  const cleanSku = normalizeCartSku(sku);
  return normalizeCartItems(items).filter((item) => item.sku !== cleanSku);
}

export function getStoredCartQuantity(items: StoredCartItem[], sku: string) {
  return normalizeCartItems(items).find((item) => item.sku === sku)?.quantity ?? 0;
}

function normalizeCartItems(items: StoredCartItem[]) {
  const merged = new Map<string, number>();

  for (const item of items) {
    const sku = normalizeCartSku(item.sku);
    const quantity = sanitizeCartQuantity(item.quantity);
    if (!sku || quantity <= 0) continue;

    merged.set(sku, Math.min((merged.get(sku) ?? 0) + quantity, CART_MAX_LINE_QUANTITY));
  }

  return [...merged.entries()]
    .slice(0, MAX_GUEST_CART_ITEMS)
    .map(([sku, quantity]) => ({ sku, quantity }));
}

function parseSignedCartValue(value: string) {
  const [version, payload, signature, ...rest] = value.split(".");

  if (rest.length > 0 || version !== SIGNED_CART_VERSION || !payload || !signature) {
    return null;
  }

  return { payload, signature };
}

function encodeCartPayload(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeCartPayload(value: string) {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

function signCartPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`${SIGNED_CART_VERSION}.${payload}`).digest("base64url");
}

function verifyCartSignature(payload: string, signature: string, secret: string) {
  if (!secret) return false;

  const expectedSignature = signCartPayload(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) return false;

  return timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
}
