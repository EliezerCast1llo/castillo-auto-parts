import { cookies } from "next/headers";
import { getLiveCatalogProducts, type CatalogProduct } from "@/data/products";
import {
  parseSignedStoredCart,
  removeStoredCartItem,
  serializeSignedStoredCart,
  serializeStoredCart as serializeStoredCartPayload,
  setStoredCartItemQuantity,
  upsertStoredCartItem,
  type StoredCartItem,
} from "./cart-state";
import { hasValidCartActionInput, normalizeCartSku } from "./cart-validation";

export const GUEST_CART_COOKIE = "castillo_guest_cart";

const CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type CartLineIssue = "insufficient_stock" | "unavailable";

export type CartLine = {
  availableQuantity: number;
  issue?: CartLineIssue;
  lineTotalCents: number;
  product: CatalogProduct;
  quantity: number;
};

export type GuestCart = {
  hasBlockingIssues: boolean;
  itemCount: number;
  lines: CartLine[];
  subtotalCents: number;
};

export async function getGuestCart(): Promise<GuestCart> {
  const [items, products] = await Promise.all([readGuestCartItems(), getLiveCatalogProducts()]);
  const productBySku = new Map(products.map((product) => [product.sku, product]));
  const lines = items.flatMap((item): CartLine[] => {
    const product = productBySku.get(item.sku);
    if (!product) return [];

    const availableQuantity =
      product.stockStatus === "No disponible" ? 0 : Math.max(product.stockQuantity, 0);
    const issue = getLineIssue(item.quantity, availableQuantity);

    return [
      {
        availableQuantity,
        issue,
        lineTotalCents: item.quantity * product.priceCents,
        product,
        quantity: item.quantity,
      },
    ];
  });

  return {
    hasBlockingIssues: lines.some((line) => Boolean(line.issue)),
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    lines,
    subtotalCents: lines.reduce((total, line) => total + line.lineTotalCents, 0),
  };
}

export async function getGuestCartItemCount() {
  const items = await readGuestCartItems();
  return items.reduce((total, item) => total + item.quantity, 0);
}

export async function addGuestCartItem(sku: string, quantity: number) {
  if (!hasValidCartActionInput(sku, quantity)) {
    return "invalid" as const;
  }

  const product = await findProductBySku(sku);
  if (!product || product.stockStatus === "No disponible" || product.stockQuantity <= 0) {
    return "unavailable" as const;
  }

  const items = await readGuestCartItems();
  const currentQuantity = items.find((item) => item.sku === product.sku)?.quantity ?? 0;
  const requestedQuantity = currentQuantity + quantity;
  const nextItems = upsertStoredCartItem(items, product.sku, quantity, product.stockQuantity);
  await writeGuestCartItems(nextItems);

  const nextQuantity = nextItems.find((item) => item.sku === product.sku)?.quantity ?? 0;
  return nextQuantity < requestedQuantity ? ("quantity_adjusted" as const) : ("added" as const);
}

export async function updateGuestCartItem(sku: string, quantity: number) {
  if (!normalizeCartSku(sku)) {
    return "invalid" as const;
  }

  const product = await findProductBySku(sku);
  if (!product || product.stockStatus === "No disponible" || product.stockQuantity <= 0) {
    await removeGuestCartItem(sku);
    return "unavailable" as const;
  }

  const items = await readGuestCartItems();
  const nextItems = setStoredCartItemQuantity(items, product.sku, quantity, product.stockQuantity);
  await writeGuestCartItems(nextItems);

  const nextQuantity = nextItems.find((item) => item.sku === product.sku)?.quantity ?? 0;
  if (nextQuantity === 0) return "removed" as const;
  return nextQuantity < quantity ? ("quantity_adjusted" as const) : ("updated" as const);
}

export async function removeGuestCartItem(sku: string) {
  if (!normalizeCartSku(sku)) return;

  const items = await readGuestCartItems();
  await writeGuestCartItems(removeStoredCartItem(items, sku));
}

export async function clearGuestCart() {
  await writeGuestCartItems([]);
}

async function readGuestCartItems(): Promise<StoredCartItem[]> {
  const cookieStore = await cookies();
  return parseSignedStoredCart(cookieStore.get(GUEST_CART_COOKIE)?.value, getGuestCartCookieSecret(), {
    allowUnsignedFallback: process.env.NODE_ENV !== "production",
  });
}

async function writeGuestCartItems(items: StoredCartItem[]) {
  const cookieStore = await cookies();
  const serializedCartPayload = serializeStoredCartPayload(items);

  if (serializedCartPayload === "[]") {
    cookieStore.delete(GUEST_CART_COOKIE);
    return;
  }

  const serializedCart = serializeGuestCartCookie(items);

  cookieStore.set(GUEST_CART_COOKIE, serializedCart, {
    httpOnly: true,
    maxAge: CART_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function serializeGuestCartCookie(items: StoredCartItem[]) {
  return serializeSignedStoredCart(items, getGuestCartCookieSecret());
}

function getGuestCartCookieSecret() {
  const secret = process.env.GUEST_CART_SECRET?.trim() || process.env.ADMIN_ACCESS_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-guest-cart-secret";
  }

  throw new Error("Missing GUEST_CART_SECRET or ADMIN_ACCESS_SECRET.");
}

async function findProductBySku(sku: string) {
  const cleanSku = normalizeCartSku(sku);
  if (!cleanSku) return undefined;

  const products = await getLiveCatalogProducts();
  return products.find((product) => product.sku === cleanSku);
}

function getLineIssue(quantity: number, availableQuantity: number): CartLineIssue | undefined {
  if (availableQuantity <= 0) return "unavailable";
  if (quantity > availableQuantity) return "insufficient_stock";
  return undefined;
}
