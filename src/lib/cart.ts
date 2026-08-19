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
      product.stockStatus === "OUT_OF_STOCK" ? 0 : Math.max(product.stockQuantity, 0);
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
  if (!product || product.stockStatus === "OUT_OF_STOCK" || product.stockQuantity <= 0) {
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
  if (!product || product.stockStatus === "OUT_OF_STOCK" || product.stockQuantity <= 0) {
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
  return parseSignedStoredCart(
    cookieStore.get(GUEST_CART_COOKIE)?.value,
    getGuestCartVerificationSecrets(),
    { allowUnsignedFallback: process.env.NODE_ENV !== "production" },
  );
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
  return serializeSignedStoredCart(items, getGuestCartSigningSecret());
}

let warnedSecretReuse = false;

// Secreto con el que se FIRMAN los cookies nuevos. Prefiere el dedicado; si no
// existe usa ADMIN_ACCESS_SECRET (compatibilidad con deploys previos) y avisa una
// vez. Así no se rompe producción y se puede migrar a GUEST_CART_SECRET sin corte.
function getGuestCartSigningSecret() {
  const dedicated = process.env.GUEST_CART_SECRET?.trim();
  if (dedicated) return dedicated;

  const adminSecret = process.env.ADMIN_ACCESS_SECRET?.trim();
  if (adminSecret) {
    if (process.env.NODE_ENV === "production" && !warnedSecretReuse) {
      warnedSecretReuse = true;
      console.warn(
        "[cart] GUEST_CART_SECRET no está definido; se usa ADMIN_ACCESS_SECRET. " +
          "Define un GUEST_CART_SECRET propio para no reusar secretos.",
      );
    }
    return adminSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-guest-cart-secret";
  }

  throw new Error("Missing GUEST_CART_SECRET or ADMIN_ACCESS_SECRET.");
}

// Secretos aceptados al VERIFICAR firmas.
// - Si no hay GUEST_CART_SECRET (deploy previo), se acepta ADMIN_ACCESS_SECRET.
// - Una vez seteado GUEST_CART_SECRET, se acepta ADMIN solo si se pide explícito
//   con GUEST_CART_ACCEPT_ADMIN_SECRET=true (ventana de migración). Al quitar el
//   flag se cierra el fallback y ADMIN deja de poder firmar carritos.
function getGuestCartVerificationSecrets(): string[] {
  const guestSecret = process.env.GUEST_CART_SECRET?.trim();
  const adminSecret = process.env.ADMIN_ACCESS_SECRET?.trim();

  const secrets: string[] = [];
  if (guestSecret) secrets.push(guestSecret);
  const acceptAdmin =
    adminSecret && (!guestSecret || process.env.GUEST_CART_ACCEPT_ADMIN_SECRET === "true");
  if (acceptAdmin) secrets.push(adminSecret);

  if (secrets.length > 0) return [...new Set(secrets)];

  if (process.env.NODE_ENV !== "production") return ["dev-only-guest-cart-secret"];

  // Fail-loud: sin ningún secreto en prod es misconfiguración. No devolver [] en
  // silencio (leería TODO carrito firmado como vacío, sin error ni log).
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
