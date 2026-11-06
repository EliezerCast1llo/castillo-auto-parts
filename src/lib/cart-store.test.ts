import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Cookie en memoria: estas pruebas miden **dónde** quedan los renglones, así
 * que la cookie tiene que poder leerse después de escribirla, no solo mockear
 * la lectura.
 */
const jar = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    cookies: async () => ({
      get: (name: string) => (store.has(name) ? { value: store.get(name)! } : undefined),
      set: (name: string, value: string) => store.set(name, value),
      delete: (name: string) => store.delete(name),
    }),
  };
});
vi.mock("next/headers", () => ({ cookies: jar.cookies }));

const { db } = await import("./db");
const {
  GUEST_CART_COOKIE,
  clearCartItems,
  mergeGuestCartIntoAccount,
  readCartItems,
  writeCartItems,
} = await import("./cart-store");

/** Toca base, así que se salta donde no hay `DATABASE_URL`, como el resto. */
const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb("dónde viven los renglones del carrito", () => {
  const productIds: string[] = [];
  const userIds: string[] = [];
  let skuA = "";
  let skuB = "";
  let userId = "";

  beforeAll(async () => {
    vi.stubEnv("NODE_ENV", "test");

    const category = await db.productCategory.findFirst({ select: { id: true } });
    if (!category) throw new Error("La base necesita al menos una categoría para esta prueba.");

    skuA = `CS-${randomUUID().slice(0, 8)}`.toUpperCase();
    skuB = `CS-${randomUUID().slice(0, 8)}`.toUpperCase();

    for (const sku of [skuA, skuB]) {
      const product = await db.product.create({
        data: {
          brand: "Prueba",
          categoryId: category.id,
          name: `Producto ${sku}`,
          priceCents: 1000,
          sku,
          slug: sku.toLowerCase(),
        },
        select: { id: true },
      });
      productIds.push(product.id);
    }

    const user = await db.user.create({
      data: { email: `cart-${randomUUID()}@e2e.castilloautoparts.com`, name: "Cliente carrito" },
      select: { id: true },
    });
    userId = user.id;
    userIds.push(user.id);
  });

  afterEach(async () => {
    jar.store.clear();
    await db.cartItem.deleteMany({ where: { productId: { in: productIds } } });
    await db.cart.deleteMany({ where: { userId: { in: userIds } } });
  });

  afterAll(async () => {
    await db.cartItem.deleteMany({ where: { productId: { in: productIds } } });
    await db.cart.deleteMany({ where: { userId: { in: userIds } } });
    await db.product.deleteMany({ where: { id: { in: productIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
    vi.unstubAllEnvs();
  });

  /**
   * El carrito del navegador se arma por el camino real y no firmando la cookie
   * a mano: el secreto de firma depende del entorno, así que una cookie escrita
   * a mano se leería como vacía y la prueba pasaría por el motivo equivocado.
   */
  function putGuestCart(items: { sku: string; quantity: number }[]) {
    return writeCartItems(null, items);
  }

  it("sin dueño escribe y lee la cookie, y no toca la base", async () => {
    await writeCartItems(null, [{ quantity: 2, sku: skuA }]);

    expect(jar.store.has(GUEST_CART_COOKIE)).toBe(true);
    await expect(readCartItems(null)).resolves.toEqual([{ quantity: 2, sku: skuA }]);
    expect(await db.cart.count({ where: { userId } })).toBe(0);
  });

  it("con dueño escribe y lee la base, y no toca la cookie", async () => {
    await writeCartItems({ userId }, [{ quantity: 3, sku: skuA }]);

    expect(jar.store.has(GUEST_CART_COOKIE)).toBe(false);
    await expect(readCartItems({ userId })).resolves.toEqual([{ quantity: 3, sku: skuA }]);
  });

  it("guarda un solo carrito por cuenta aunque se escriba varias veces", async () => {
    await writeCartItems({ userId }, [{ quantity: 1, sku: skuA }]);
    await writeCartItems({ userId }, [{ quantity: 5, sku: skuB }]);

    expect(await db.cart.count({ where: { userId } })).toBe(1);
    await expect(readCartItems({ userId })).resolves.toEqual([{ quantity: 5, sku: skuB }]);
  });

  it("descarta un SKU que no existe como producto", async () => {
    // `CartItem` apunta al producto, no al SKU: un SKU sin producto no se puede
    // guardar. Es la misma desaparición que ya tenía la cookie al leer.
    await writeCartItems({ userId }, [
      { quantity: 1, sku: skuA },
      { quantity: 9, sku: "NO-EXISTE-123" },
    ]);

    await expect(readCartItems({ userId })).resolves.toEqual([{ quantity: 1, sku: skuA }]);
  });

  describe("fusión al entrar", () => {
    it("suma el carrito del navegador al de la cuenta y borra la cookie", async () => {
      await writeCartItems({ userId }, [{ quantity: 2, sku: skuA }]);
      await putGuestCart([
        { quantity: 1, sku: skuA },
        { quantity: 4, sku: skuB },
      ]);

      await mergeGuestCartIntoAccount(userId);

      const merged = await readCartItems({ userId });
      expect(merged).toHaveLength(2);
      expect(merged).toEqual(
        expect.arrayContaining([
          { quantity: 3, sku: skuA },
          { quantity: 4, sku: skuB },
        ]),
      );

      // Si la cookie sobreviviera, el próximo ingreso volvería a sumar lo mismo
      // y las cantidades crecerían solas en cada entrada.
      expect(jar.store.has(GUEST_CART_COOKIE)).toBe(false);
    });

    it("no toca el carrito de la cuenta si el navegador no traía nada", async () => {
      await writeCartItems({ userId }, [{ quantity: 2, sku: skuA }]);

      await mergeGuestCartIntoAccount(userId);

      await expect(readCartItems({ userId })).resolves.toEqual([{ quantity: 2, sku: skuA }]);
    });

    it("crea el carrito de la cuenta cuando no existía", async () => {
      await putGuestCart([{ quantity: 2, sku: skuB }]);

      await mergeGuestCartIntoAccount(userId);

      await expect(readCartItems({ userId })).resolves.toEqual([{ quantity: 2, sku: skuB }]);
    });
  });

  it("vaciar borra los dos lugares", async () => {
    // Tras comprar no puede quedar rastro en ninguno: si quedara la cookie, el
    // próximo ingreso la volvería a fundir en la cuenta ya cobrada.
    await writeCartItems({ userId }, [{ quantity: 2, sku: skuA }]);
    await putGuestCart([{ quantity: 1, sku: skuB }]);

    await clearCartItems({ userId });

    await expect(readCartItems({ userId })).resolves.toEqual([]);
    expect(jar.store.has(GUEST_CART_COOKIE)).toBe(false);
  });
});
