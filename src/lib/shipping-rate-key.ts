import type { ShippingRate } from "./shipping";

/** Pure identity shared by the browser and server, without provider/logging dependencies. */
export function shippingRateKey(rate: Pick<ShippingRate, "provider" | "courierId" | "serviceType">) {
  return JSON.stringify([rate.provider, rate.courierId, rate.serviceType]);
}
