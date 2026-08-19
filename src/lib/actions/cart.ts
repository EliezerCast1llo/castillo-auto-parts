"use server";

import { headers } from "next/headers";
import { revalidateStorefrontPath } from "@/lib/i18n/revalidate";
import { getLocale } from "next-intl/server";
import { redirect } from "@/lib/i18n/navigation";
import { addGuestCartItem, removeGuestCartItem, updateGuestCartItem } from "@/lib/cart";
import { createRateLimiter } from "@/lib/rate-limit";
import { createStockAlertRequest } from "@/lib/stock-alerts";

const stockAlertRateLimiter = createRateLimiter({
  lockoutMs: 15 * 60 * 1000,
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
});

export async function addCartItem(formData: FormData) {
  const locale = await getLocale();
  const sku = String(formData.get("sku") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const shouldStayOnPage = formData.get("stayOnPage") === "true";
  const result = await addGuestCartItem(sku, quantity);

  if (shouldStayOnPage) {
    revalidateStorefrontPath("/");
    revalidateStorefrontPath("/catalog");
    revalidateStorefrontPath("/cart");
    return;
  }

  redirect({ href: `/cart?estado=${result}`, locale });
}

export type AddCartItemInlineState = {
  status: Awaited<ReturnType<typeof addGuestCartItem>>;
  /** Cambia en cada envío para que el cliente reaccione aunque el status se repita. */
  at: number;
} | null;

/**
 * Variante sin redirect para el flujo "toast + seguir comprando".
 * Devuelve el resultado para que el cliente muestre feedback y refresque el
 * contador del carrito sin navegar.
 */
export async function addCartItemInline(
  _previousState: AddCartItemInlineState,
  formData: FormData,
): Promise<AddCartItemInlineState> {
  const sku = String(formData.get("sku") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const status = await addGuestCartItem(sku, quantity);

  // Refresca el contador del carrito en el header también cuando el cliente no
  // puede ejecutar router.refresh() (envío del form sin JS).
  revalidateStorefrontPath("/");
  revalidateStorefrontPath("/catalog");
  revalidateStorefrontPath("/cart");

  return { status, at: Date.now() };
}

export async function updateCartItem(formData: FormData) {
  const locale = await getLocale();
  const sku = String(formData.get("sku") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const result = await updateGuestCartItem(sku, quantity);

  redirect({ href: `/cart?estado=${result}`, locale });
}

export async function removeCartItem(formData: FormData) {
  const locale = await getLocale();
  const sku = String(formData.get("sku") ?? "");
  await removeGuestCartItem(sku);

  redirect({ href: "/cart?estado=removed", locale });
}

export async function createStockAlert(formData: FormData) {
  const locale = await getLocale();
  const rateLimit = stockAlertRateLimiter.registerFailure(await getStockAlertRateLimitKey());
  if (!rateLimit.allowed) {
    redirect({ href: "/cart?estado=stock_alert_rate_limited", locale });
  }

  const result = await createStockAlertRequest(formData);

  redirect({ href: `/cart?estado=stock_alert_${result}`, locale });
}

async function getStockAlertRateLimitKey() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerStore.get("x-real-ip")?.trim();
  return `stock-alert:${forwardedFor || realIp || "local"}`;
}
