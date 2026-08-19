import { expect, test, type BrowserContext } from "@playwright/test";
import { addProductToCart, fillCustomerFields, getStockSnapshot, prisma } from "./helpers";

test.afterAll(async () => {
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// El submit de checkout usa una idempotencyKey (hidden input de 64 hex generado
// una vez por render). Dos envíos con la MISMA key deben crear UNA sola Order y
// reservar el stock UNA sola vez; el segundo debe reusar el checkout del primero.
//
// El carrito de invitado vive íntegramente en un cookie firmado (ver src/lib/cart.ts),
// no en la DB. Por eso dos requests concurrentes que llevan el mismo cookie ven ambos
// el carrito lleno y ambos llegan a la comprobación de idempotencia. (Un reenvío
// SECUENCIAL tras completar el primero no sirve: clearGuestCart limpia el cookie y el
// segundo submit corta antes por "empty_cart"). Por eso disparamos los dos POST del
// Server Action en paralelo, con cuerpo + headers + cookie idénticos.
test("double submit with the same idempotency key creates only one order", async ({
  page,
  context,
}) => {
  const sku = "MOCK-SPK-CIV-15T";
  const email = `qa-idem-${Date.now()}@e2e.castilloautoparts.com`;
  const initialStock = await getStockSnapshot(sku);

  await addProductToCart(page, "bujia-iridio-honda-civic-15t");
  await page.goto("/checkout");
  await fillCustomerFields(page, {
    email,
    name: "Cliente QA Idempotencia",
    phone: "7777-3000",
  });

  const idempotencyKey = await page.locator('input[name="idempotencyKey"]').inputValue();
  expect(idempotencyKey).toMatch(/^[a-f0-9]{64}$/);

  // Interceptamos el POST real del Server Action para capturar URL + headers + body
  // exactos (incluye Next-Action, Origin/Host para el check CSRF, el cookie del carrito
  // y todos los campos del formulario). Abortamos el request del navegador: nosotros
  // reproduciremos ese mismo request DOS veces en paralelo.
  let captured: { url: string; headers: Record<string, string>; body: Buffer | null } | null = null;
  await page.route(/\/checkout$/, async (route) => {
    const request = route.request();
    if (request.method() === "POST" && !captured) {
      captured = {
        body: request.postDataBuffer(),
        headers: request.headers(),
        url: request.url(),
      };
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.getByRole("button", { name: "Confirmar y pagar" }).click();
  await expect.poll(() => Boolean(captured)).toBeTruthy();

  const submit = () => replayServerAction(context, captured!);
  const [first, second] = await Promise.all([submit(), submit()]);

  // Ambos submits deben ser aceptados por el server (no 4xx/5xx): así descartamos
  // que "solo una orden" se deba a que el segundo request fue rechazado (p. ej. CSRF)
  // en vez de a la idempotencia real.
  expect(first).toBeLessThan(400);
  expect(second).toBeLessThan(400);

  // Idempotencia probada a nivel DB (harness de DB aislada):
  // 1) Existe exactamente UNA Order con esa key.
  const orders = await prisma.order.findMany({
    where: { idempotencyKey },
    include: { items: true, payment: true },
  });
  expect(orders).toHaveLength(1);
  expect(orders[0].customerEmail).toBe(email);

  // 2) La orden reservó la cantidad pedida (1) una sola vez.
  const orderedQty = orders[0].items.reduce((total, item) => total + item.quantity, 0);
  expect(orderedQty).toBe(1);

  // 3) El stock reservado del SKU subió exactamente en 1 (no en 2). SKU dedicado a
  //    este test para que la aserción de delta no dependa de otras specs en paralelo.
  const afterStock = await getStockSnapshot(sku);
  expect(afterStock.quantityOnHand).toBe(initialStock.quantityOnHand);
  expect(afterStock.quantityReserved).toBe(initialStock.quantityReserved + 1);

  // NOTA: esta variante prueba que un doble-submit concurrente con la misma key
  // produce UNA sola orden + UNA sola reserva. No verifica desde el HTTP la URL de
  // checkout devuelta al segundo submit (el Server Action responde un stream RSC);
  // el replay del checkoutUrl está cubierto por los tests unitarios de orders.ts.
});

// Regresión: un checkout normal (un solo submit) sigue creando exactamente una orden.
test("a single normal checkout creates exactly one order", async ({ page }) => {
  const sku = "MOCK-SPK-COR-18";
  const email = `qa-single-${Date.now()}@e2e.castilloautoparts.com`;
  const initialStock = await getStockSnapshot(sku);

  await addProductToCart(page, "bujia-platino-toyota-corolla-18");
  await page.goto("/checkout");
  await fillCustomerFields(page, {
    email,
    name: "Cliente QA Único",
    phone: "7777-4000",
  });

  await expect(page.getByRole("heading", { name: "Retiro en bodega" })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar y pagar" }).click();

  await expect(page).toHaveURL(/\/payments\/mock\/MOCK-CAP-/);

  const orders = await prisma.order.findMany({ where: { customerEmail: email } });
  expect(orders).toHaveLength(1);

  const afterStock = await getStockSnapshot(sku);
  expect(afterStock.quantityOnHand).toBe(initialStock.quantityOnHand);
  expect(afterStock.quantityReserved).toBe(initialStock.quantityReserved + 1);
});

// ---------------------------------------------------------------------------
// Helpers (compartidos en ./helpers; solo replayServerAction es propio de este spec)
// ---------------------------------------------------------------------------

// Reproduce el POST del Server Action capturado, reutilizando el cookie jar del contexto.
// Devuelve el status HTTP. content-length se omite: page.request lo recalcula según el body.
async function replayServerAction(
  context: BrowserContext,
  captured: { url: string; headers: Record<string, string>; body: Buffer | null },
) {
  const headers = { ...captured.headers };
  delete headers["content-length"];
  const response = await context.request.post(captured.url, {
    data: captured.body ?? "",
    headers,
    maxRedirects: 0,
  });
  return response.status();
}
