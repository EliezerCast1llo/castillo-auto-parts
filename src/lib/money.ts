const DEFAULT_LOCALE = "es-SV";
const DEFAULT_CURRENCY = "USD";

export function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).format(amountCents / 100);
}

export function getIncludedTax(totalCents: number, taxRate = 0.13) {
  return Math.round(totalCents - totalCents / (1 + taxRate));
}

export function getSubtotalBeforeIncludedTax(totalCents: number, taxRate = 0.13) {
  return totalCents - getIncludedTax(totalCents, taxRate);
}

