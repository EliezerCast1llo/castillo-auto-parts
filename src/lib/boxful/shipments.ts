import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "../db";
import { logError, logInfo, observeOperation } from "../logger";
import { boxfulConfig, boxfulError } from "./config";
import { BoxfulHttpError, boxfulRequest } from "./client";
import { snapshotSchema } from "./provider";
import { queueShippingAlert, flushShippingAlerts } from "./alerts";

export const remoteShipmentSchema = z.object({ id: z.string().min(1), shipmentNumber: z.string().min(1), trackingUrl: z.string().optional(), labelUrl: z.string().optional(), status: z.union([z.number(), z.string()]).optional(), statusDescription: z.string().optional() });
export type RemoteShipment = z.infer<typeof remoteShipmentSchema>;
export function safeCarrierUrl(value?: string) {
  try { const url = new URL(value || ""); return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null; } catch { return null; }
}
export async function getRemoteShipment(id: string): Promise<RemoteShipment | null> {
  try {
    const response = z.object({ shipment: remoteShipmentSchema }).safeParse(await boxfulRequest(`/shipment/${encodeURIComponent(id)}`));
    if (!response.success) throw boxfulError("PROVIDER_REJECTED");
    return response.data.shipment;
  } catch (error) {
    if (error instanceof BoxfulHttpError && error.status === 404) return null;
    throw error;
  }
}
export async function ensureBoxfulShipment(orderNumber: string) {
  // This integration must never affect the successful card payment response.
  try {
    return await observeOperation("boxful_label", async () => {
      const order = await db.order.findUnique({ where: { orderNumber }, include: { shipment: true, address: true, payment: true } });
      const shipment = order?.shipment;
      if (!order || !shipment || shipment.provider !== "boxful" || shipment.method !== "NATIONAL_SHIPPING" || order.payment?.status !== "PAID" || order.status !== "PAID_PENDING_SHIPMENT") return;
      if (shipment.creationState === "CREATED") return;
      const config = boxfulConfig();
      const snapshot = snapshotSchema.parse(shipment.boxfulSnapshot);
      if (snapshot.accountScope !== config.scope || process.env.BOXFUL_ORDER_REFERENCE_CONFIRMED !== "true") throw boxfulError();
      if (shipment.attemptedAt) {
        // The API supports lookup by our orderNumber. A 404 after a lost response
        // is NOT proof of no side effect: never blindly POST a second waybill.
        const remote = await getRemoteShipment(shipment.externalId || orderNumber);
        if (remote) { await saveCreatedShipment(shipment.id, config.scope, shipment.quotedCents ?? 0, remote); return; }
        if (shipment.creationState === "UNKNOWN" || shipment.creationState === "CREATING") return;
      }
      const claim = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${order.id} FOR UPDATE`;
        return tx.shipment.updateMany({ where: { id: shipment.id, creationState: { in: ["PENDING", "FAILED"] }, order: { status: "PAID_PENDING_SHIPMENT", payment: { status: "PAID" } } }, data: { creationState: "UNKNOWN", attemptedAt: new Date(), lastErrorCode: null } });
      });
      if (!claim.count) return;
      try {
        const address = order.address;
        if (!address || !shipment.courierId) throw boxfulError();
        const names = order.customerName.trim().split(/\s+/);
        const response = z.object({ shipmentData: remoteShipmentSchema }).safeParse(await boxfulRequest("/shipment", {
          ...snapshot, accountScope: undefined, stateId: undefined, cityId: undefined,
          recolectionDate: new Date(Math.max(Date.parse(snapshot.recolectionDate), Date.now() + 60 * 60_000)).toISOString(),
          orderNumber, courierId: shipment.courierId, cod: false, codAmount: 0,
          customerName: names[0], customerLastname: names.slice(1).join(" ") || names[0], customerEmail: order.customerEmail,
          customerPhone: order.customerPhone.replace(/\D/g, "").replace(/^503(?=\d{8}$)/, ""), customerPhoneAreaCode: "+503",
          customerAddress: [address.addressLine1, address.addressLine2].filter(Boolean).join(", "),
          customerState: snapshot.stateId, customerCity: snapshot.cityId, customerAddressReferencePoint: address.landmark,
          customerAddressLatitude: Number(address.latitude), customerAddressLongitude: Number(address.longitude), instructions: address.deliveryNotes || address.landmark,
        }));
        if (!response.success) throw boxfulError("PROVIDER_UNAVAILABLE");
        await saveCreatedShipment(shipment.id, config.scope, shipment.quotedCents ?? 0, response.data.shipmentData);
      } catch (error) {
        // Only documented request rejection is safe to repeat after correction.
        const definitive = error instanceof BoxfulHttpError && [400, 401, 403, 409, 422].includes(error.status);
        await db.shipment.update({ where: { id: shipment.id }, data: { creationState: definitive ? "FAILED" : "UNKNOWN", lastErrorCode: definitive ? "PROVIDER_REJECTED" : "PROVIDER_UNAVAILABLE" } });
        throw boxfulError(definitive ? "PROVIDER_REJECTED" : "PROVIDER_UNAVAILABLE");
      }
    });
  } catch {
    await logError({ context: "boxful_label", outcome: "failed" }, boxfulError("PROVIDER_UNAVAILABLE"));
    try { await queueShippingAlert(orderNumber); await flushShippingAlerts(); } catch { /* Durable retry via authenticated cron. */ }
  }
}
async function saveCreatedShipment(id: string, accountScope: string, quotedCents: number, remote: RemoteShipment) {
  await db.$transaction(async (tx) => {
    await tx.shipment.update({ where: { id }, data: { creationState: "CREATED", status: "PENDING", externalId: remote.id, shipmentNumber: remote.shipmentNumber, trackingUrl: safeCarrierUrl(remote.trackingUrl), labelUrl: safeCarrierUrl(remote.labelUrl), lastErrorCode: null } });
    await tx.boxfulBalanceEntry.createMany({ data: { id: `shipment:${id}`, accountScope, amountCents: -quotedCents }, skipDuplicates: true });
  });
  await logInfo({ context: "boxful_label", outcome: "completed" });
}
const descriptions: Record<string, string> = { "Creado en sistema": "-1", Registrado: "1", Recolectado: "2", "En ruta a destino": "3", Entregado: "4", "Guía cancelada": "5", "Problemas en gestión": "6", "Finalizada con problemas": "7", "No entregado": "8", "Devuelto en bodega": "9", "No recolectado": "10", "Ubicado en locker": "11" };
export function boxfulStatus(remote: RemoteShipment) {
  const value = remote.status === undefined ? descriptions[remote.statusDescription ?? ""] : String(remote.status);
  return ["-1", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"].includes(value) ? value : null;
}
export async function reconcileBoxfulShipment(externalId: string) {
  const local = await db.shipment.findUnique({ where: { externalId } });
  if (!local || local.provider !== "boxful" || local.creationState !== "CREATED") return "ignored";
  const snapshot = snapshotSchema.parse(local.boxfulSnapshot);
  if (snapshot.accountScope !== boxfulConfig().scope) return "ignored";
  const remote = await getRemoteShipment(externalId);
  if (!remote || remote.id !== externalId || remote.shipmentNumber !== local.shipmentNumber) throw boxfulError("PROVIDER_REJECTED");
  const status = boxfulStatus(remote);
  if (status === null) return "ignored";
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${local.orderId} FOR UPDATE`;
    const current = await tx.shipment.findUniqueOrThrow({ where: { id: local.id }, include: { order: { include: { payment: true } } } });
    if (current.order.payment?.status !== "PAID" || ["CANCELLED", "REFUNDED", "DELIVERED"].includes(current.order.status)) return "ignored";
    const eventKey = createHash("sha256").update(`${externalId}:${status}`).digest("hex");
    const event = await tx.shipmentEvent.createMany({ data: { shipmentId: local.id, eventKey, status }, skipDuplicates: true });
    if (!event.count) return "duplicate";
    const state = status === "4" ? "DELIVERED" : ["2", "3", "11"].includes(status) ? "IN_TRANSIT" : status === "5" ? "CANCELLED" : ["6", "7", "8", "9", "10"].includes(status) ? "INCIDENT" : "PENDING";
    await tx.shipment.update({ where: { id: local.id }, data: { status: state, trackingUrl: safeCarrierUrl(remote.trackingUrl) ?? current.trackingUrl, ...(state === "DELIVERED" ? { deliveredAt: new Date() } : {}) } });
    if (state === "DELIVERED" || state === "IN_TRANSIT") await tx.order.update({ where: { id: current.orderId }, data: { status: state === "DELIVERED" ? "DELIVERED" : "SHIPPED" } });
    // Courier cancellation/incident never cancels a paid order or refunds/restocks it.
    return "processed";
  });
}
