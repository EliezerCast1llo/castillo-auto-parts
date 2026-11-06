import { buildShippingPackages, type ShippingPackage } from "./shipping";
import { getLiveCatalogProducts, type CatalogProduct } from "@/data/products";
import {
  removeStoredCartItem,
  setStoredCartItemQuantity,
  upsertStoredCartItem,
} from "./cart-state";
import { resolveCartOwner } from "./cart-owner";
import { clearCartItems, readCartItems, writeCartItems } from "./cart-store";
import { hasValidCartActionInput, normalizeCartSku } from "./cart-validation";

/**
 * El carrito del visitante.
 *
 * Este módulo arma el carrito —precios, stock, paquetes de envío— y no sabe
 * dónde están guardados los renglones: eso lo decide `cart-store`, que los pone
 * en la cuenta o en una cookie según el ajuste del panel. Los nombres dejaron
 * de decir "guest" cuando dejó de ser cierto que siempre fuera un invitado.
 *
 * Los precios y el stock **siempre** se resuelven contra el catálogo vivo al
 * leer, se guarde donde se guarde: lo almacenado es solo SKU y cantidad. Por
 * eso un cambio de precio o una baja de stock aparecen solos, sin tocar nada.
 */
export { GUEST_CART_COOKIE } from "./cart-store";

export type CartLineIssue = "insufficient_stock" | "unavailable";

export type CartLine = {
  availableQuantity: number;
  issue?: CartLineIssue;
  lineTotalCents: number;
  product: CatalogProduct;
  quantity: number;
};

export type CartSummary = {
  totalWeightGrams?: number | null;
  shippingPackages?: ShippingPackage[];
  hasBlockingIssues: boolean;
  itemCount: number;
  lines: CartLine[];
  subtotalCents: number;
};

export async function getCart(): Promise<CartSummary> {
  const owner = await resolveCartOwner();
  const [items, products] = await Promise.all([readCartItems(owner), getLiveCatalogProducts()]);
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

  const shipping = buildShippingPackages(lines);
  return {
    totalWeightGrams: shipping?.totalWeightGrams ?? null,
    shippingPackages: shipping?.packages ?? [],
    hasBlockingIssues: lines.some((line) => Boolean(line.issue)),
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    lines,
    subtotalCents: lines.reduce((total, line) => total + line.lineTotalCents, 0),
  };
}

export async function getCartItemCount() {
  const owner = await resolveCartOwner();
  const items = await readCartItems(owner);
  return items.reduce((total, item) => total + item.quantity, 0);
}

export async function addItemToCart(sku: string, quantity: number) {
  if (!hasValidCartActionInput(sku, quantity)) {
    return "invalid" as const;
  }

  const product = await findProductBySku(sku);
  if (!product || product.stockStatus === "OUT_OF_STOCK" || product.stockQuantity <= 0) {
    return "unavailable" as const;
  }

  const owner = await resolveCartOwner();
  const items = await readCartItems(owner);
  const currentQuantity = items.find((item) => item.sku === product.sku)?.quantity ?? 0;
  const requestedQuantity = currentQuantity + quantity;
  const nextItems = upsertStoredCartItem(items, product.sku, quantity, product.stockQuantity);
  await writeCartItems(owner, nextItems);

  const nextQuantity = nextItems.find((item) => item.sku === product.sku)?.quantity ?? 0;
  return nextQuantity < requestedQuantity ? ("quantity_adjusted" as const) : ("added" as const);
}

export async function updateCartItemQuantity(sku: string, quantity: number) {
  if (!normalizeCartSku(sku)) {
    return "invalid" as const;
  }

  const owner = await resolveCartOwner();
  const product = await findProductBySku(sku);
  if (!product || product.stockStatus === "OUT_OF_STOCK" || product.stockQuantity <= 0) {
    await writeCartItems(owner, removeStoredCartItem(await readCartItems(owner), sku));
    return "unavailable" as const;
  }

  const items = await readCartItems(owner);
  const nextItems = setStoredCartItemQuantity(items, product.sku, quantity, product.stockQuantity);
  await writeCartItems(owner, nextItems);

  const nextQuantity = nextItems.find((item) => item.sku === product.sku)?.quantity ?? 0;
  if (nextQuantity === 0) return "removed" as const;
  return nextQuantity < quantity ? ("quantity_adjusted" as const) : ("updated" as const);
}

export async function removeItemFromCart(sku: string) {
  if (!normalizeCartSku(sku)) return;

  const owner = await resolveCartOwner();
  const items = await readCartItems(owner);
  await writeCartItems(owner, removeStoredCartItem(items, sku));
}

export async function clearCart() {
  await clearCartItems(await resolveCartOwner());
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
