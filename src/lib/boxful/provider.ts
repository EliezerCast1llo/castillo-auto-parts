import "server-only";
import { z } from "zod";
import { db } from "../db";
import type { ShippingRateProvider, ShippingRequest } from "../shipping";
import { boxfulRequest } from "./client";
import { boxfulConfig, boxfulError } from "./config";

export const parcelSchema = z.object({ content: z.string(), width: z.number().positive().optional(), height: z.number().positive().optional(), length: z.number().positive().optional(), weight: z.number().positive(), price: z.number().nonnegative() });
export const snapshotSchema = z.object({ accountScope: z.string(), recolectionAddressId: z.string(), recolectionDate: z.string().datetime(), stateId: z.string(), cityId: z.string(), parcels: z.array(parcelSchema).min(1).max(200) });
export type BoxfulSnapshot = z.infer<typeof snapshotSchema>;
const courierSchema = z.array(z.object({ id: z.string().min(1).max(120), name: z.string().min(1).max(100), price: z.number().finite().positive(), estimatedDelivery: z.string().optional(), deliveryType: z.string().optional() })).max(100);

export function boxfulParcels(request: ShippingRequest) {
  // Owner confirmed pounds; dimensions may be omitted rather than fabricated.
  const unit = process.env.BOXFUL_WEIGHT_UNIT;
  const dimension = process.env.BOXFUL_DIMENSION_UNIT || "omit";
  if (!["kg", "lb"].includes(unit ?? "") || !["cm", "in", "omit"].includes(dimension)) throw boxfulError("CONFIG_MISSING");
  if (request.packages.reduce((sum, p) => sum + p.quantity, 0) > 200) throw boxfulError();
  const parcels = request.packages.flatMap((p) => Array.from({ length: p.quantity }, () => ({
    content: p.sku, weight: p.weightGrams / (unit === "kg" ? 1000 : 453.59237),
    ...(dimension === "omit" ? {} : { width: p.widthMm / (dimension === "cm" ? 10 : 25.4), height: p.heightMm / (dimension === "cm" ? 10 : 25.4), length: p.lengthMm / (dimension === "cm" ? 10 : 25.4) }), price: (p.priceCents ?? 0) / 100,
  })));
  if (parcels.length > 200) throw boxfulError();
  return parcels;
}
export function boxfulDate(value?: string) {
  if (!value) return undefined;
  // Boxful's unzoned estimatedDelivery is Salvador local time, never host time.
  const zoned = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value) ? value.replace(" ", "T") + ":00-06:00" : value;
  return Number.isFinite(Date.parse(zoned)) ? new Date(zoned).toISOString() : undefined;
}
export const boxfulShippingProvider: ShippingRateProvider = {
  async getRates(request) {
    const config = boxfulConfig();
    const location = await db.boxfulLocation.findFirst({ where: { accountScope: config.scope, department: request.destination.department, municipality: request.destination.city, cityId: request.destination.cityId ?? "" } });
    const pickup = process.env.BOXFUL_PICKUP_ADDRESS_ID;
    const clientId = process.env.BOXFUL_CLIENT_ID;
    if (!location || !pickup || !clientId || process.env.BOXFUL_ORDER_REFERENCE_CONFIRMED !== "true") return [];
    const parcels = boxfulParcels(request);
    const recolectionDate = new Date(Date.now() + 60 * 60_000).toISOString();
    const snapshot: BoxfulSnapshot = { accountScope: config.scope, recolectionAddressId: pickup, recolectionDate, stateId: location.stateId, cityId: location.cityId, parcels };
    const data = courierSchema.safeParse(await boxfulRequest("/courier/available", {
      clientId, packages: parcels, recolectionDateTime: recolectionDate, recolectionAddressId: pickup,
      customerAddress: { latitude: request.destination.latitude, longitude: request.destination.longitude, stateId: location.stateId, cityId: location.cityId }, cod: false, codAmount: 0,
    }));
    if (!data.success) throw boxfulError("PROVIDER_REJECTED");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" }).format(new Date());
    return data.data.map((c) => {
      const estimatedDeliveryAt = boxfulDate(c.estimatedDelivery);
      const sameDay = c.deliveryType === "same-day" || (estimatedDeliveryAt && new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" }).format(new Date(estimatedDeliveryAt)) === today);
      return { provider: "boxful", courierId: c.id, courierName: c.name, priceCents: Math.round(c.price * 100), serviceType: sameDay ? "same-day" : "next-day", estimatedDeliveryAt, boxfulSnapshot: snapshot };
    });
  },
};

const catalogSchema = z.array(z.object({ id: z.string(), name: z.string(), Cities: z.array(z.object({ id: z.string(), name: z.string() })) }));
export async function boxfulCatalog() {
  const parsed = catalogSchema.safeParse(await boxfulRequest("/states"));
  if (!parsed.success) throw boxfulError("PROVIDER_REJECTED");
  return parsed.data;
}
