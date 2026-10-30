"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createAddress } from "@/lib/actions/account-addresses";
import { CheckoutLocationPicker } from "@/components/checkout/checkout-location-picker";
import { emptyNationalAddress, NationalAddressInputs } from "@/components/checkout/national-address-fields";

export function AddAddressForm({ onSave }: { onSave?: () => void }) {
  const t = useTranslations("Account.addresses");
  const [fields, setFields] = useState(emptyNationalAddress);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  return <>
    <form ref={formRef} action={createAddress} hidden={reviewing} className="space-y-4" onSubmit={(event) => {
      event.preventDefault(); setReviewing(true);
    }}>
      <NationalAddressInputs value={fields} onChange={setFields} />
      <CheckoutLocationPicker />
      <button type="submit" className="min-h-11 w-full rounded-xl bg-ca-navy-950 px-4 font-bold text-white">{t("review")}</button>
    </form>
    {reviewing ? <section className="space-y-4">
      <h3 className="font-bold">{t("confirmTitle")}</h3>
      <p>{t("verifyBeforeSaving")}</p>
      <div className="rounded-xl bg-ca-background p-4 text-sm"><p>{fields.addressLine1}, {fields.addressLine2}</p><p>{fields.city}, {fields.department}</p><p>{fields.landmark}</p><p>{fields.deliveryNotes}</p></div>
      <div className="flex gap-3">
        <button type="button" className="min-h-11 rounded-xl border px-4" onClick={() => setReviewing(false)}>{t("edit")}</button>
        <button type="button" disabled={saving} className="min-h-11 rounded-xl bg-ca-navy-950 px-4 font-bold text-white disabled:opacity-50" onClick={async () => { if (!formRef.current) return; const data = new FormData(formRef.current); setSaving(true); onSave?.(); await createAddress(data); }}>{t(saving ? "saving" : "save")}</button>
      </div>
    </section> : null}
  </>;
}
