/**
 * Claves cuyo texto es legítimamente idéntico en todos los idiomas: nombres de
 * marca, siglas y préstamos que no se traducen.
 *
 * Vive en su propio módulo y no dentro de un test porque la usan dos: el de
 * paridad de catálogos y el que decide si un idioma puede publicarse. Cuando
 * estaba en uno de ellos, importarla desde el otro arrastraba sus pruebas y las
 * corría dos veces.
 *
 * La lista se escribe a mano a propósito: agregar una clave acá es afirmar que
 * se miró y que la coincidencia es correcta, no que el test molestaba.
 */
export const IDENTICAL_BY_DESIGN = new Set<string>([
  // "Subtotal", "Email" y "Total" son la misma palabra en los dos idiomas.
  "Cart.summary.subtotal",
  "Checkout.summary.subtotal",
  "Checkout.form.email",
  "Orders.detail.total",
  // Nombre de la marca: no se traduce en ningún idioma.
  "Account.header.brandEyebrow",
  // "SKU" es la misma sigla en los dos idiomas.
  "Orders.card.sku",
  // Nombre propio del país: se escribe igual en los dos idiomas.
  "Footer.country",
]);
