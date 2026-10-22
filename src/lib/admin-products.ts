import { InventoryStatus } from "@prisma/client";
import { canonicalizeVehicle, splitMakeAndModel } from "@/data/vehicle-catalog";
import { slugifyValue } from "@/lib/slug";

export type ParsedCompatibility = {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
};

export function slugifyProductValue(value: string) {
  return slugifyValue(value);
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
    // Separar "Marca Modelo" (texto libre) del rango "YYYY-YYYY" al final.
    const match = line.match(/^(.+?)\s+(\d{4})\s*-\s*(\d{4})$/);

    if (!match) {
      invalidLines.push(line);
      continue;
    }

    // Longest-prefix contra marcas canónicas: soporta marcas multi-palabra
    // ("Land Rover Defender"); fallback: primera palabra = marca.
    const split = splitMakeAndModel(match[1]);

    if (!split) {
      invalidLines.push(line);
      continue;
    }

    const yearFrom = Number(match[2]);
    const yearTo = Number(match[3]);

    if (yearFrom > yearTo) {
      invalidLines.push(line);
      continue;
    }

    items.push({
      ...canonicalizeVehicle(split),
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
