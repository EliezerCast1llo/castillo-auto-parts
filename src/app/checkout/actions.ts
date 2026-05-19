"use server";

import { redirect } from "next/navigation";
import { createPendingOrderFromGuestCart } from "@/lib/orders";

export async function createPendingOrder(formData: FormData) {
  const result = await createPendingOrderFromGuestCart(formData);

  if (result.status === "created") {
    redirect(`/orders/${result.orderNumber}`);
  }

  if (result.status === "empty_cart" || result.status === "stock_issue") {
    redirect(`/cart?estado=${result.status}`);
  }

  redirect(`/checkout?estado=${result.status}`);
}
