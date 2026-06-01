"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const SV_DEPARTMENTS = [
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad",
  "La Paz", "La Unión", "Morazán", "San Miguel", "San Salvador",
  "San Vicente", "Santa Ana", "Sonsonate", "Usulután",
];

export async function createAddress(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const deliveryNotes = String(formData.get("deliveryNotes") ?? "").trim();

  if (!addressLine1 || !city || !department) {
    redirect("/account/addresses?estado=missing_fields");
  }

  if (!SV_DEPARTMENTS.includes(department)) {
    redirect("/account/addresses?estado=invalid_department");
  }

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
    },
  });

  redirect("/account/addresses?estado=created");
}

export async function deleteAddress(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const id = String(formData.get("id") ?? "");
  await db.address.deleteMany({ where: { id, userId: session.user.id } });

  redirect("/account/addresses?estado=deleted");
}
