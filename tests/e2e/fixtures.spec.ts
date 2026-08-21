import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { allClaims, PRODUCT_CLAIMS } from "./fixtures/products";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * La reserva de productos entre specs, verificada.
 *
 * Sin esto `fixtures/products.ts` sería un comentario largo: describiría la
 * regla sin impedir que se rompa. El fallo que ataja no se ve en el spec que lo
 * causa —el spec nuevo elige un producto y pasa— sino en otro, en la suite
 * completa, una corrida de cada tantas.
 */
test.describe("reserva de productos entre specs", () => {
  test("ningún SKU está reclamado por dos specs", () => {
    const porSku = new Map<string, string[]>();

    for (const { spec, name, claim } of allClaims()) {
      porSku.set(claim.sku, [...(porSku.get(claim.sku) ?? []), `${spec}:${name}`]);
    }

    const compartidos = [...porSku.entries()]
      .filter(([, duenos]) => duenos.length > 1)
      .map(([sku, duenos]) => `${sku} lo usan ${duenos.join(" y ")}`);

    expect(compartidos).toEqual([]);
  });

  test("cada reserva apunta a un producto que existe, con su slug", async () => {
    // Un SKU mal escrito no rompe la reserva: la vuelve inútil, porque protege
    // un producto que no es el que el spec usa.
    for (const { spec, name, claim } of allClaims()) {
      const producto = await prisma.product.findUnique({
        where: { sku: claim.sku },
        select: { slug: true },
      });

      expect(producto, `${spec}:${name} reserva ${claim.sku}, que no existe`).not.toBeNull();
      expect(producto?.slug, `${spec}:${name} tiene el slug desalineado del SKU`).toBe(claim.slug);
    }
  });

  test("los specs que compran tienen inventario holgado", async () => {
    // Las aserciones de delta de stock comparan antes contra después. Con
    // inventario justo, cualquier otra compra concurrente las rompe — y el
    // margen es lo único que hace que el paralelismo sea seguro acá.
    const MINIMO = 4;

    for (const { spec, name, claim } of allClaims()) {
      if (claim.use !== "consumes-stock") continue;

      const stock = await prisma.inventoryStock.findFirstOrThrow({
        where: { product: { sku: claim.sku } },
        select: { quantityOnHand: true },
      });

      expect(
        stock.quantityOnHand,
        `${spec}:${name} compra ${claim.sku}, que solo tiene ${stock.quantityOnHand}`,
      ).toBeGreaterThanOrEqual(MINIMO);
    }
  });

  test("la tabla cubre todos los specs que tocan inventario", () => {
    // Si un spec nuevo empieza a comprar y no se anota acá, esta lista deja de
    // reflejar la realidad y las otras tres pruebas pasan sobre datos viejos.
    expect(Object.keys(PRODUCT_CLAIMS).sort()).toEqual([
      "catalog-cart.spec.ts",
      "checkout-idempotency.spec.ts",
      "i18n.spec.ts",
      "responsive.spec.ts",
    ]);
  });
});
