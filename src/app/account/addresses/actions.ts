"use server";

import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth-user";
import { db } from "@/lib/db";
import { formString, optionalFormString } from "@/lib/form-utils";

export async function addAddressAction(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/auth/login");

  const addressLine1 = formString(formData, "addressLine1").trim();
  const addressLine2 = optionalFormString(formData, "addressLine2");
  const city = formString(formData, "city").trim();
  const department = formString(formData, "department").trim();
  const deliveryNotes = optionalFormString(formData, "deliveryNotes");
  const latitudeRaw = optionalFormString(formData, "latitude");
  const longitudeRaw = optionalFormString(formData, "longitude");

  if (!addressLine1 || !city || !department) {
    redirect("/account/addresses?estado=invalid");
  }

  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : undefined;

  const parts = [addressLine1, addressLine2, city, department, "El Salvador"].filter(Boolean);
  const formattedAddress = parts.join(", ");

  await db.address.create({
    data: {
      userId: session.id,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      city,
      department,
      country: "SV",
      deliveryNotes: deliveryNotes || undefined,
      formattedAddress,
      latitude: latitude && !isNaN(latitude) ? latitude : undefined,
      longitude: longitude && !isNaN(longitude) ? longitude : undefined,
    },
  });

  redirect("/account/addresses?estado=added");
}
