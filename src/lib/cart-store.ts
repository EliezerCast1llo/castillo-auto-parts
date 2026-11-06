import "server-only";
import { cookies } from "next/headers";
import {
  mergeStoredCarts,
  parseSignedStoredCart,
  serializeSignedStoredCart,
  serializeStoredCart,
  type StoredCartItem,
} from "@/lib/cart-state";
import { db } from "@/lib/db";

/**
 * Dónde viven los renglones del carrito.
 *
 * Hay dos lugares posibles y el resto del carrito no debería saber cuál se usa:
 * arriba de esto solo existe "los renglones del visitante".
 *
 *   - **Cookie firmada**: siempre para invitados, y también para quien inició
 *     sesión si el ajuste de carrito persistente está apagado. Es por navegador.
 *   - **Base**: para quien inició sesión con el ajuste encendido. Sigue a la
 *     cuenta entre dispositivos.
 *
 * Este módulo **no** importa `auth`: recibe el dueño ya resuelto. Si lo
 * importara habría un ciclo, porque `auth` importa la fusión de carritos de acá
 * para correrla al entrar.
 */
export const GUEST_CART_COOKIE = "castillo_guest_cart";

const CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** `null` significa invitado: no hay cuenta donde guardar. */
export type CartOwner = { userId: string } | null;

export async function readCartItems(owner: CartOwner): Promise<StoredCartItem[]> {
  return owner ? readAccountCartItems(owner.userId) : readGuestCartItems();
}

export async function writeCartItems(owner: CartOwner, items: StoredCartItem[]): Promise<void> {
  if (owner) {
    await writeAccountCartItems(owner.userId, items);
    return;
  }

  await writeGuestCartItems(items);
}

/**
 * Pasa el carrito del navegador a la cuenta al entrar.
 *
 * Corre en el evento de ingreso de Auth.js y no en cada lectura del carrito
 * porque hay que **borrar la cookie**, y las cookies no se pueden escribir
 * mientras se renderiza una página: solo en acciones y manejadores de ruta.
 *
 * Si no se borrara, la cookie seguiría viva y volvería a fundirse en cada
 * ingreso, duplicando cantidades una y otra vez.
 */
export async function mergeGuestCartIntoAccount(userId: string): Promise<void> {
  const guestItems = await readGuestCartItems();
  if (guestItems.length === 0) return;

  const accountItems = await readAccountCartItems(userId);

  await writeAccountCartItems(userId, mergeStoredCarts(guestItems, accountItems));
  await writeGuestCartItems([]);
}

/** Vacía los dos lugares: tras comprar no debe quedar rastro en ninguno. */
export async function clearCartItems(owner: CartOwner): Promise<void> {
  await writeGuestCartItems([]);
  if (owner) await writeAccountCartItems(owner.userId, []);
}

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

async function readAccountCartItems(userId: string): Promise<StoredCartItem[]> {
  const cart = await db.cart.findUnique({
    where: { userId },
    select: {
      items: {
        select: { quantity: true, product: { select: { sku: true } } },
      },
    },
  });

  if (!cart) return [];

  // Se normaliza al salir: la base puede tener una fila vieja de un producto que
  // desde entonces cambió de SKU o quedó fuera de los topes.
  return mergeStoredCarts(
    cart.items.map((item) => ({ quantity: item.quantity, sku: item.product.sku })),
    [],
  );
}

async function writeAccountCartItems(userId: string, items: StoredCartItem[]): Promise<void> {
  // Los identificadores salen de la base y no del catálogo cacheado: `CartItem`
  // apunta al producto por id, y el tipo del catálogo no lo expone —solo el
  // SKU, que es lo que la tienda muestra—.
  const products = items.length
    ? await db.product.findMany({
        where: { sku: { in: items.map((item) => item.sku) } },
        select: { id: true, priceCents: true, sku: true },
      })
    : [];
  const productBySku = new Map(products.map((product) => [product.sku, product]));

  // Un SKU sin producto no se puede guardar. Es la misma desaparición silenciosa
  // que ya tenía la cookie, donde un SKU desconocido no produce renglón al leer.
  const rows = items.flatMap((item) => {
    const product = productBySku.get(item.sku);
    if (!product) return [];

    return [
      {
        productId: product.id,
        quantity: item.quantity,
        // El carrito muestra el precio vivo, no este. Se guarda igual porque es
        // el precio que el cliente vio al agregar, y esa diferencia es lo único
        // que después explica un reclamo de "me cambió el precio".
        priceSnapshotCents: product.priceCents,
      },
    ];
  });

  await db.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      create: { userId },
      update: {},
      where: { userId },
      select: { id: true },
    });

    // Reemplazo completo y no diferencial: el carrito tiene a lo sumo unas
    // decenas de renglones, y calcular el diferencial sería más código para
    // ahorrar una consulta que nadie está midiendo.
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (rows.length > 0) {
      await tx.cartItem.createMany({
        data: rows.map((row) => ({ ...row, cartId: cart.id })),
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Cookie
// ---------------------------------------------------------------------------

async function readGuestCartItems(): Promise<StoredCartItem[]> {
  const cookieStore = await cookies();
  return parseSignedStoredCart(
    cookieStore.get(GUEST_CART_COOKIE)?.value,
    getGuestCartVerificationSecrets(),
    { allowUnsignedFallback: process.env.NODE_ENV !== "production" },
  );
}

async function writeGuestCartItems(items: StoredCartItem[]): Promise<void> {
  const cookieStore = await cookies();

  if (serializeStoredCart(items) === "[]") {
    cookieStore.delete(GUEST_CART_COOKIE);
    return;
  }

  cookieStore.set(GUEST_CART_COOKIE, serializeSignedStoredCart(items, getGuestCartSigningSecret()), {
    httpOnly: true,
    maxAge: CART_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
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
