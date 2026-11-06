import "server-only";
import type { CartOwner } from "@/lib/cart-store";
import { getStoreSetting } from "@/lib/store-settings";

/**
 * Decide si el carrito de este visitante vive en su cuenta o en su navegador.
 *
 * El ajuste se consulta **antes** que la sesión a propósito: con el carrito
 * persistente apagado la respuesta es "navegador" sin importar quién sea, y así
 * el camino es exactamente el que existía antes de que el ajuste existiera,
 * sin una verificación de sesión de más por request.
 */
export async function resolveCartOwner(): Promise<CartOwner> {
  const isPersistent = await getStoreSetting("persistentCart");
  if (!isPersistent) return null;

  const session = await readSession();
  const userId = session?.user?.id;

  return userId ? { userId } : null;
}

/**
 * Carga `auth` recién cuando hace falta.
 *
 * Con un import normal, todo lo que toca el carrito pasa a depender del stack
 * de Auth.js: `orders.ts` importa el carrito y guarda lógica pura de huellas e
 * idempotencia, que dejó de poder cargarse sola en cuanto este módulo arrastró
 * next-auth. El import diferido corta esa cadena, y de paso evita el ciclo con
 * `auth`, que importa la fusión de carritos para correrla al entrar.
 *
 * El costo es un solo resolve: el módulo queda cacheado desde la primera vez.
 */
async function readSession() {
  const { auth } = await import("@/lib/auth");
  return auth();
}
