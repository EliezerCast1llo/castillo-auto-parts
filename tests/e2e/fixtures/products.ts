/**
 * Qué producto usa cada spec, y para qué.
 *
 * Los specs corren con `fullyParallel: true` y contextos de navegador
 * separados, pero **comparten una sola base de datos**. Un spec que compra
 * consume inventario y otro que deja un producto sin stock lo pone en cero:
 * cualquiera de los dos rompe al que estuviera mirando ese mismo producto.
 *
 * Ese fallo aparece solo en la suite completa y desaparece corriendo el spec
 * solo, que es la peor forma de fallar — invita a culpar a la infraestructura y
 * a subir el timeout.
 *
 * La reserva vive acá y no en un comentario dentro de cada spec porque un
 * comentario solo lo lee quien ya está mirando ese archivo, y el que rompe la
 * regla es justamente el que está mirando otro. `fixtures.spec.ts` verifica que
 * ningún SKU esté reclamado dos veces, así que romperla falla en vez de
 * convertirse en un intermitente.
 *
 * Antes de agregar una entrada: elegir un producto que no esté acá, y si el
 * spec compra, uno con inventario holgado —las aserciones de delta de stock no
 * toleran una compra concurrente.
 */

/**
 * Qué le hace el spec al inventario del producto.
 *
 * - `zeroes-stock`: lo deja en cero. Ningún otro spec puede agregarlo al carrito.
 * - `consumes-stock`: completa una compra. Rompe aserciones de delta ajenas.
 * - `cart-only`: solo lo agrega al carrito; no toca inventario, pero necesita
 *   que siga disponible, así que no puede compartir con los dos de arriba.
 */
type StockUse = "zeroes-stock" | "consumes-stock" | "cart-only";

export type ProductClaim = {
  sku: string;
  slug: string;
  use: StockUse;
};

export const PRODUCT_CLAIMS = {
  "catalog-cart.spec.ts": {
    pickupOrder: {
      sku: "MOCK-SPK-HK-16",
      slug: "bujia-iridio-hyundai-kia-16l",
      use: "consumes-stock",
    },
    stockAlert: {
      sku: "MOCK-FIL-TOY-18",
      slug: "filtro-aceite-toyota-18l",
      use: "zeroes-stock",
    },
  },
  "checkout-idempotency.spec.ts": {
    doubleSubmit: {
      sku: "MOCK-SPK-CIV-15T",
      slug: "bujia-iridio-honda-civic-15t",
      use: "consumes-stock",
    },
    singleSubmit: {
      sku: "MOCK-SPK-COR-18",
      slug: "bujia-platino-toyota-corolla-18",
      use: "consumes-stock",
    },
  },
  "i18n.spec.ts": {
    cartAndCheckout: {
      sku: "MOCK-BRK-SEN-F",
      slug: "pastillas-delanteras-nissan-sentra",
      use: "cart-only",
    },
  },
  "responsive.spec.ts": {
    cartLayout: {
      sku: "MOCK-BRK-CIV-F",
      slug: "pastillas-delanteras-honda-civic",
      use: "cart-only",
    },
  },
} as const satisfies Record<string, Record<string, ProductClaim>>;

/** Todas las reservas, aplanadas con el spec que las hizo. */
export function allClaims(): { spec: string; name: string; claim: ProductClaim }[] {
  return Object.entries(PRODUCT_CLAIMS).flatMap(([spec, claims]) =>
    Object.entries(claims).map(([name, claim]) => ({ spec, name, claim })),
  );
}
