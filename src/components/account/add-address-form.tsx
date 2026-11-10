"use client";

import { buttonVariants } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createAddress } from "@/lib/actions/account-addresses";
import { CheckoutLocationPicker } from "@/components/checkout/checkout-location-picker";
import { emptyNationalAddress, NationalAddressInputs } from "@/components/checkout/national-address-fields";
import { useRouter } from "@/lib/i18n/navigation";

export type AddressErrorMessages = Record<"missing_fields" | "invalid_department" | "invalid_location", string>;

export function AddAddressForm({ onSave, errorMessages }: { onSave?: () => void; errorMessages: AddressErrorMessages }) {
  const t = useTranslations("Account.addresses");
  const router = useRouter();
  const [fields, setFields] = useState(emptyNationalAddress);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<keyof AddressErrorMessages>();
  const formRef = useRef<HTMLFormElement>(null);
  return <>
    <form ref={formRef} hidden={reviewing} className="space-y-4" onSubmit={(event) => {
      event.preventDefault(); setError(undefined); setReviewing(true);
    }}>
      <NationalAddressInputs value={fields} onChange={setFields} />
      <CheckoutLocationPicker />
      <button type="submit" className={buttonVariants({ className: "w-full" })}>{t("review")}</button>
    </form>
    {reviewing ? <section className="space-y-4">
      <h3 className="font-bold">{t("confirmTitle")}</h3>
      <p>{t("verifyBeforeSaving")}</p>
      <div className="rounded-ca-control bg-ca-bg p-4 text-sm"><p>{fields.addressLine1}, {fields.addressLine2}</p><p>{fields.city}, {fields.department}</p><p>{fields.landmark}</p><p>{fields.deliveryNotes}</p></div>
      {error ? <p role="alert" className="text-sm text-danger">{errorMessages[error]}</p> : null}
      <div className="flex gap-3">
        <button type="button" className="min-h-11 rounded-ca-control border px-4" onClick={() => setReviewing(false)}>{t("edit")}</button>
        <button type="button" disabled={saving} className={buttonVariants()} onClick={async () => {
          if (!formRef.current || saving) return;
          const data = new FormData(formRef.current);
          setSaving(true); setError(undefined);
          try {
            const result = await createAddress(data);
            if ("error" in result) setError(result.error);
            else {
              onSave?.();
              router.push({ pathname: "/account/addresses", query: { estado: "created" } });
            }
          } finally { setSaving(false); }
        }}>{t(saving ? "saving" : "save")}</button>
      </div>
    </section> : null}
  </>;
}
