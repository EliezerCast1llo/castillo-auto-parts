"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminRole } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { boxfulConfig } from "@/lib/boxful/config";
import { boxfulCatalog } from "@/lib/boxful/provider";
import { isNationalAddress } from "@/data/el-salvador";
import { writeAdminAuditLog } from "@/lib/admin-audit";

export async function saveBoxfulLocation(form: FormData) {
  await requireAdminRole("ADMIN");
  const input = z.object({ department: z.string().max(80), municipality: z.string().max(80), stateId: z.string().max(120), cityId: z.string().max(120) }).safeParse(Object.fromEntries(form));
  if (!input.success || !isNationalAddress(input.data.department, input.data.municipality)) redirect("/admin/boxful?estado=invalid");
  try {
    const scope = boxfulConfig().scope;
    const catalog = await boxfulCatalog();
    const state = catalog.find((s) => s.id === input.data.stateId && s.name === input.data.department);
    const city = state?.Cities.find((c) => c.id === input.data.cityId);
    if (!city) redirect("/admin/boxful?estado=invalid");
    const data = { accountScope: scope, ...input.data, district: city.name };
    await db.$transaction(async (tx) => {
      await tx.boxfulLocation.upsert({ where: { accountScope_department_municipality_cityId: { accountScope: scope, department: data.department, municipality: data.municipality, cityId: data.cityId } }, create: data, update: data });
      await writeAdminAuditLog(tx, { action: "boxful.location_verified", entityType: "BoxfulLocation", metadata: { department: data.department, municipality: data.municipality, district: city.name } });
    });
  } catch { redirect("/admin/boxful?estado=unavailable"); }
  revalidatePath("/admin/boxful"); redirect("/admin/boxful?estado=saved");
}
export async function deleteBoxfulLocation(form: FormData) {
  await requireAdminRole("ADMIN");
  const id = String(form.get("id") || "");
  await db.boxfulLocation.deleteMany({ where: { id, accountScope: boxfulConfig().scope } });
  revalidatePath("/admin/boxful");
}
export async function recordBoxfulTopup(form: FormData) {
  await requireAdminRole("ADMIN", "ACCOUNTING");
  const parsed = z.object({ id: z.string().uuid(), amountCents: z.coerce.number().int().positive().max(100_000_000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/admin/boxful?estado=invalid");
  try {
    const { scope } = boxfulConfig();
    await db.$transaction(async (tx) => {
      await tx.boxfulBalanceEntry.createMany({ data: { id: `topup:${scope}:${parsed.data.id}`, accountScope: scope, amountCents: parsed.data.amountCents }, skipDuplicates: true });
      await writeAdminAuditLog(tx, { action: "boxful.topup_recorded", entityType: "BoxfulBalanceEntry", metadata: { amountCents: parsed.data.amountCents } });
    });
  } catch { redirect("/admin/boxful?estado=unavailable"); }
  revalidatePath("/admin/boxful"); redirect("/admin/boxful?estado=saved");
}
