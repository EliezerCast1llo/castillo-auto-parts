"use client";

import { useTranslations } from "next-intl";
import { departments, municipalitiesByDepartment } from "@/data/el-salvador";

export type NationalAddressFields = { addressLine1: string; addressLine2: string; department: string; city: string; landmark: string; deliveryNotes: string };
export const emptyNationalAddress: NationalAddressFields = { addressLine1: "", addressLine2: "", department: "", city: "", landmark: "", deliveryNotes: "" };
const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-ca-border bg-ca-background px-3 py-2 text-sm";

export function NationalAddressInputs({ value, onChange }: { value: NationalAddressFields; onChange: (value: NationalAddressFields) => void }) {
  const t = useTranslations("Checkout.delivery");
  return <div className="grid gap-4 sm:grid-cols-2">
    {(["addressLine1", "addressLine2", "landmark"] as const).map((name) => <label className="block text-sm font-semibold sm:col-span-2" key={name}>
      {t(name === "addressLine1" ? "address" : name)}
      <input className={inputClass} name={name} maxLength={name === "landmark" ? 200 : name === "addressLine1" ? 160 : 120} required={name !== "addressLine2"} value={value[name]} onChange={(e) => onChange({ ...value, [name]: e.target.value })} />
    </label>)}
    <label className="block text-sm font-semibold">{t("department")}
      <select aria-label={t("department")} className={inputClass} name="department" required value={value.department} onChange={(e) => onChange({ ...value, department: e.target.value, city: "" })}>
        <option value="">{t("selectDepartment")}</option>
        {departments.map((name) => <option key={name}>{name}</option>)}
      </select>
    </label>
    <label className="block text-sm font-semibold">{t("city")}
      <select aria-label={t("city")} className={inputClass} name="city" required value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })}>
        <option value="">{t("selectCity")}</option>
        {(municipalitiesByDepartment[value.department] ?? []).map((name) => <option key={name}>{name}</option>)}
      </select>
    </label>
    <label className="block text-sm font-semibold sm:col-span-2">{t("notes")}
      <textarea className={inputClass} name="deliveryNotes" maxLength={500} value={value.deliveryNotes} onChange={(e) => onChange({ ...value, deliveryNotes: e.target.value })} />
    </label>
  </div>;
}
