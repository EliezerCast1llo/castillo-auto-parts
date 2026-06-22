"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createGuestCheckoutFromCart } from "@/lib/orders";

export async function createGuestOrder(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;

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

  const result = await createGuestCheckoutFromCart(formData, userId);

  if (result.status === "created") {
    redirect(result.checkoutUrl);
  }

  if (result.status === "empty_cart" || result.status === "stock_issue") {
    redirect(`/cart?estado=${result.status}`);
  }

  redirect(`/checkout?estado=${result.status}`);
}
