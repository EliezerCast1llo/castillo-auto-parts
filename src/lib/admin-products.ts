import { InventoryStatus } from "@prisma/client";

export type ParsedCompatibility = {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
};

export function slugifyProductValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseAdminPriceCents(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  return Math.round(Number(normalized) * 100);
}

export function formatAdminPriceInput(priceCents: number) {
  return (priceCents / 100).toFixed(2);
}

export function parseTechnicalDetails(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseCompatibilityLines(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items: ParsedCompatibility[] = [];
  const invalidLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ]+)\s+(.+?)\s+(\d{4})\s*-\s*(\d{4})$/);

    if (!match) {
      invalidLines.push(line);
      continue;
    }

    const yearFrom = Number(match[3]);
    const yearTo = Number(match[4]);

    if (yearFrom > yearTo) {
      invalidLines.push(line);
      continue;
    }

    items.push({
      make: match[1],
      model: match[2],
      yearFrom,
      yearTo,
    });
  }

  return { invalidLines, items };
}

export function normalizeAdminInventoryStatus({
  quantityOnHand,
  requestedStatus,
}: {
  quantityOnHand: number;
  requestedStatus: InventoryStatus;
}) {
  if (requestedStatus === InventoryStatus.PREORDER) return InventoryStatus.PREORDER;
  if (quantityOnHand <= 0) return InventoryStatus.OUT_OF_STOCK;
  return requestedStatus;
}
