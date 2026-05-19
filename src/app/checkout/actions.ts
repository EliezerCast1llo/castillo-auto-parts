"use server";

import { redirect } from "next/navigation";
import { createPaidGuestOrderFromCart } from "@/lib/orders";

export async function createGuestOrder(formData: FormData) {
  const result = await createPaidGuestOrderFromCart(formData);

  if (result.status === "created") {
    redirect(`/orders/${result.orderNumber}`);
  }

  if (result.status === "empty_cart" || result.status === "stock_issue") {
    redirect(`/cart?estado=${result.status}`);
  }

  redirect(`/checkout?estado=${result.status}`);
}
