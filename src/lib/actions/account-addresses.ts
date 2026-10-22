"use server";

import { getActionLocale } from "@/lib/i18n/action-locale";
import { redirect } from "@/lib/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const SV_DEPARTMENTS = [
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad",
  "La Paz", "La Unión", "Morazán", "San Miguel", "San Salvador",
  "San Vicente", "Santa Ana", "Sonsonate", "Usulután",
];

export async function createAddress(formData: FormData) {
  const locale = await getActionLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/auth/login", locale });

  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const deliveryNotes = String(formData.get("deliveryNotes") ?? "").trim();
  const latitudeRaw = String(formData.get("latitude") ?? "").trim();
  const longitudeRaw = String(formData.get("longitude") ?? "").trim();

  if (!addressLine1 || !city || !department) {
    redirect({ href: { pathname: "/account/addresses", query: { estado: "missing_fields" } }, locale });
  }

  if (!SV_DEPARTMENTS.includes(department)) {
    redirect({ href: { pathname: "/account/addresses", query: { estado: "invalid_department" } }, locale });
  }

  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : undefined;

  const formattedAddress = [addressLine1, addressLine2, city, department, "El Salvador"]
    .filter(Boolean)
    .join(", ");

  await db.address.create({
    data: {
      userId: session.user.id,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      department,
      country: "SV",
      deliveryNotes: deliveryNotes || null,
      formattedAddress,
      latitude: latitude && !isNaN(latitude) ? latitude : undefined,
      longitude: longitude && !isNaN(longitude) ? longitude : undefined,
    },
  });

  redirect({ href: { pathname: "/account/addresses", query: { estado: "created" } }, locale });
}

export async function deleteAddress(formData: FormData) {
  const locale = await getActionLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/auth/login", locale });

  const id = String(formData.get("id") ?? "");
  await db.address.deleteMany({ where: { id, userId: session.user.id } });

  redirect({ href: { pathname: "/account/addresses", query: { estado: "deleted" } }, locale });
}
