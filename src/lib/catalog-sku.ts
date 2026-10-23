import "server-only";
import { Prisma } from "@prisma/client";
import { SKU_WHITESPACE } from "./product-sku";

/** Shared identity lookup for the editor and CSV; never rename/merge legacy rows here. */
export async function findCatalogSkuMatches(
  tx: Pick<Prisma.TransactionClient, "$queryRaw">,
  normalizedSkus: string[],
  excludeProductId?: string,
) {
  if (!normalizedSkus.length) return [];
  return tx.$queryRaw<Array<{ id: string; sku: string }>>(Prisma.sql`
    SELECT id, sku FROM "Product"
    WHERE upper(translate(sku, ${SKU_WHITESPACE}, '')) IN (${Prisma.join(normalizedSkus)})
    ${excludeProductId ? Prisma.sql`AND id <> ${excludeProductId}` : Prisma.empty}
    ORDER BY sku ASC, id ASC
  `);
}
