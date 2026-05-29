"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { buildOrderAccessHref } from "@/lib/order-access-token";
import { createPaidGuestOrderFromCart } from "@/lib/orders";

export async function createGuestOrder(formData: FormData) {
  // Si hay sesión activa, asociar la orden al usuario
  const session = await auth();
  const userId = session?.user?.id;

  const result = await createPaidGuestOrderFromCart(formData, userId);

  if (result.status === "created") {
    redirect(buildOrderAccessHref(result.orderNumber, result.accessToken));
  }

  if (result.status === "empty_cart" || result.status === "stock_issue") {
    redirect(`/cart?estado=${result.status}`);
  }

  redirect(`/checkout?estado=${result.status}`);
}
