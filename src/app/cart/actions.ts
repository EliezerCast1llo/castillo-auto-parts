"use server";

import { redirect } from "next/navigation";
import { addGuestCartItem, removeGuestCartItem, updateGuestCartItem } from "@/lib/cart";

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
