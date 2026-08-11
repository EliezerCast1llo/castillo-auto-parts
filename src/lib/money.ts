const DEFAULT_LOCALE = "es-SV";
const DEFAULT_CURRENCY = "USD";

export function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).format(amountCents / 100);
}

/**
 * Precio partido en sus piezas, para la tipografía de retail: el entero manda
 * y los centavos van en superíndice. Se usa formatToParts en vez de un regex
 * para no asumir el separador decimal del locale.
 */
export function formatCurrencyParts(amountCents: number) {
  const parts = new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).formatToParts(amountCents / 100);

  const join = (...types: Intl.NumberFormatPartTypes[]) =>
    parts
      .filter((part) => types.includes(part.type))
      .map((part) => part.value)
      .join("");

  return {
    currency: join("currency"),
    integer: join("integer", "group"),
    fraction: join("fraction"),
  };
}

export function getIncludedTax(totalCents: number, taxRate = 0.13) {
  return Math.round(totalCents - totalCents / (1 + taxRate));
}

export function getSubtotalBeforeIncludedTax(totalCents: number, taxRate = 0.13) {
  return totalCents - getIncludedTax(totalCents, taxRate);
}

