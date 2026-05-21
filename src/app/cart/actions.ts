"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { addGuestCartItem, removeGuestCartItem, updateGuestCartItem } from "@/lib/cart";
import { createRateLimiter } from "@/lib/rate-limit";
import { createStockAlertRequest } from "@/lib/stock-alerts";

const stockAlertRateLimiter = createRateLimiter({
  lockoutMs: 15 * 60 * 1000,
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
});

export async function addCartItem(formData: FormData) {
  const sku = String(formData.get("sku") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const result = await addGuestCartItem(sku, quantity);

  redirect(`/cart?estado=${result}`);
}

export async function updateCartItem(formData: FormData) {
  const sku = String(formData.get("sku") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const result = await updateGuestCartItem(sku, quantity);

  redirect(`/cart?estado=${result}`);
}

export async function removeCartItem(formData: FormData) {
  const sku = String(formData.get("sku") ?? "");
  await removeGuestCartItem(sku);

  redirect("/cart?estado=removed");
}

export async function createStockAlert(formData: FormData) {
  const rateLimit = stockAlertRateLimiter.registerFailure(await getStockAlertRateLimitKey());
  if (!rateLimit.allowed) {
    redirect("/cart?estado=stock_alert_rate_limited");
  }

  const result = await createStockAlertRequest(formData);

  redirect(`/cart?estado=stock_alert_${result}`);
}

async function getStockAlertRateLimitKey() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  return `stock-alert:${forwardedFor || realIp || "local"}`;
}
