"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect as localeRedirect } from "@/lib/i18n/navigation";
import { auth } from "@/lib/auth";
import { normalizeCheckoutIdempotencyKey } from "@/lib/checkout-idempotency";
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

  const locale = await getLocale();
  const result = await createGuestCheckoutFromCart(formData, userId, idempotencyKey, locale);

  if (result.status === "created") {
    // URL del proveedor de pagos: absoluta y ajena al ruteo de idiomas.
    redirect(result.checkoutUrl);
  }


  if (result.status === "empty_cart" || result.status === "stock_issue") {
    localeRedirect({ href: `/cart?estado=${result.status}`, locale });
  }

  localeRedirect({ href: `/checkout?estado=${result.status}`, locale });
}
