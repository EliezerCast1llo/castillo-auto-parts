"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  CHECKOUT_RETRY_KEY_COOKIE,
  normalizeCheckoutIdempotencyKey,
} from "@/lib/checkout-idempotency";
import { db } from "@/lib/db";
import { createGuestCheckoutFromCart } from "@/lib/orders";

export async function createGuestOrder(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  const idempotencyKey = normalizeCheckoutIdempotencyKey(formData.get("idempotencyKey"));

  // Para usuarios autenticados, usamos sus datos del perfil directamente
  // para no depender de hidden inputs ni requerir que tengan teléfono cargado.
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });
    if (user) {
      formData.set("customerName", user.name ?? "Cliente");
      formData.set("customerEmail", user.email);
      formData.set("customerPhone", user.phone ?? "00000000");
    }
  }

  const result = await createGuestCheckoutFromCart(formData, userId, idempotencyKey);
  const cookieStore = await cookies();

  if (result.status === "created") {
    // Éxito: la key ya cumplió su rol, se limpia para que el próximo checkout use una nueva.
    cookieStore.delete(CHECKOUT_RETRY_KEY_COOKIE);
    redirect(result.checkoutUrl);
  }

  if (result.status === "empty_cart" || result.status === "stock_issue") {
    redirect(`/cart?estado=${result.status}`);
  }

  if (result.status === "duplicate_in_progress" && idempotencyKey) {
    // Preserva la key para que el reintento la reuse (reproduce, no duplica).
    cookieStore.set(CHECKOUT_RETRY_KEY_COOKIE, idempotencyKey, {
      httpOnly: true,
      maxAge: 120,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  redirect(`/checkout?estado=${result.status}`);
}
