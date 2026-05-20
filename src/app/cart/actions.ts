"use server";

import { redirect } from "next/navigation";
import { addGuestCartItem, removeGuestCartItem, updateGuestCartItem } from "@/lib/cart";
import { createStockAlertRequest } from "@/lib/stock-alerts";

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
  const result = await createStockAlertRequest(formData);

  redirect(`/cart?estado=stock_alert_${result}`);
}
