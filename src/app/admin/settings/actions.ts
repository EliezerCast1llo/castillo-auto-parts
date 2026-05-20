"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { parseAdminPriceCents, slugifyProductValue } from "@/lib/admin-products";
import { requireAdminAccess } from "@/lib/admin-auth";
import { DEFAULT_LOCATION_CODE } from "@/lib/fulfillment";
import { db } from "@/lib/db";

export async function updatePickupSettings(formData: FormData) {
  await requireAdminAccess("/admin/settings");

  const name = formString(formData, "name");
  const address = formString(formData, "address");
  const pickupHours = formString(formData, "pickupHours");
  const pickupInstructions = formString(formData, "pickupInstructions");
  const latitude = parseOptionalDecimal(formString(formData, "latitude"));
  const longitude = parseOptionalDecimal(formString(formData, "longitude"));

  if (!name || !address || latitude === "invalid" || longitude === "invalid") {
    redirect("/admin/settings?estado=invalid_pickup");
  }

  try {
    await db.$transaction(async (tx) => {
      const location = await tx.inventoryLocation.upsert({
        where: { code: DEFAULT_LOCATION_CODE },
        update: {
          address,
          isActive: true,
          isDefault: true,
          latitude,
          longitude,
          name,
          pickupHours: pickupHours || null,
          pickupInstructions: pickupInstructions || null,
        },
        create: {
          address,
          code: DEFAULT_LOCATION_CODE,
          isActive: true,
          isDefault: true,
          latitude,
          longitude,
          name,
          pickupHours: pickupHours || null,
          pickupInstructions: pickupInstructions || null,
        },
      });

      await writeAdminAuditLog(tx, {
        action: "settings.pickup.updated",
        entityId: location.id,
        entityLabel: location.code,
        entityType: "InventoryLocation",
        metadata: {
          address,
          latitude,
          longitude,
          name,
          pickupHours: pickupHours || null,
          pickupInstructions: pickupInstructions || null,
        },
      });
    });
  } catch (error) {
    handleSettingsError(error, "pickup");
  }

  revalidateFulfillmentPaths();
  redirect("/admin/settings?estado=pickup_updated");
}

export async function createDeliveryZone(formData: FormData) {
  await requireAdminAccess("/admin/settings");

  const input = parseDeliveryZoneFormData(formData);
  if (!input) redirect("/admin/settings?estado=invalid_zone");

  try {
    await db.$transaction(async (tx) => {
      const zone = await tx.deliveryZone.create({
        data: input,
      });

      await writeAdminAuditLog(tx, {
        action: "delivery_zone.created",
        entityId: zone.id,
        entityLabel: zone.slug,
        entityType: "DeliveryZone",
        metadata: input,
      });
    });
  } catch (error) {
    handleSettingsError(error, "zone");
  }

  revalidateFulfillmentPaths();
  redirect("/admin/settings?estado=zone_created");
}

export async function updateDeliveryZone(formData: FormData) {
  await requireAdminAccess("/admin/settings");

  const zoneId = formString(formData, "zoneId");
  const input = parseDeliveryZoneFormData(formData);
  if (!zoneId || !input) redirect("/admin/settings?estado=invalid_zone");

  try {
    await db.$transaction(async (tx) => {
      const previousZone = await tx.deliveryZone.findUnique({
        where: { id: zoneId },
        select: {
          city: true,
          department: true,
          feeCents: true,
          isActive: true,
          name: true,
          slug: true,
          sortOrder: true,
        },
      });
      const zone = await tx.deliveryZone.update({
        data: input,
        where: { id: zoneId },
      });

      await writeAdminAuditLog(tx, {
        action: "delivery_zone.updated",
        entityId: zone.id,
        entityLabel: zone.slug,
        entityType: "DeliveryZone",
        metadata: {
          next: input,
          previous: previousZone,
        },
      });
    });
  } catch (error) {
    handleSettingsError(error, "zone");
  }

  revalidateFulfillmentPaths();
  redirect("/admin/settings?estado=zone_updated");
}

function parseDeliveryZoneFormData(formData: FormData) {
  const name = formString(formData, "name");
  const city = formString(formData, "city");
  const department = formString(formData, "department");
  const feeCents = parseAdminPriceCents(formString(formData, "fee"));
  const sortOrder = parseInteger(formString(formData, "sortOrder"));
  const slug = slugifyProductValue(formString(formData, "slug") || name || city);

  if (!name || !city || !department || !slug || feeCents === null || sortOrder === null) {
    return null;
  }

  return {
    city,
    department,
    feeCents,
    isActive: formData.get("isActive") === "true",
    name,
    slug,
    sortOrder,
  };
}

function revalidateFulfillmentPaths() {
  revalidatePath("/checkout");
  revalidatePath("/admin/settings");
}

function handleSettingsError(error: unknown, scope: "pickup" | "zone"): never {
  if (isPrismaUniqueError(error)) {
    redirect("/admin/settings?estado=duplicate");
  }

  console.error(error);
  redirect(`/admin/settings?estado=${scope === "pickup" ? "pickup_error" : "zone_error"}`);
}

function isPrismaUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function parseOptionalDecimal(value: string) {
  if (!value) return null;
  if (!/^-?\d+(\.\d+)?$/.test(value)) return "invalid" as const;
  return Number(value);
}

function parseInteger(value: string) {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
