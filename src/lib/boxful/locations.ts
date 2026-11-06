import "server-only";
import { db } from "../db";
import { boxfulConfig } from "./config";
export async function checkoutBoxfulLocations() {
  if (process.env.SHIPPING_PROVIDER !== "boxful") return [];
  try {
    return await db.boxfulLocation.findMany({ where: { accountScope: boxfulConfig().scope }, select: { cityId: true, department: true, municipality: true, district: true }, orderBy: { district: "asc" } });
  } catch { return []; }
}
