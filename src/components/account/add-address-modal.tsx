"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AddAddressForm } from "./add-address-form";

export function AddAddressModal() {
  const t = useTranslations("Account.addresses");
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="min-h-11 rounded-xl bg-ca-navy-950 px-4 text-sm font-bold text-white" onClick={() => setOpen(true)}>{t("newTitle")}</button>
    {open ? createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="new-address-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between"><h2 id="new-address-title" className="font-bold">{t("newTitle")}</h2><button className="min-h-11 px-3" type="button" onClick={() => setOpen(false)}>{t("cancel")}</button></div>
        <AddAddressForm onSave={() => setOpen(false)} />
      </section>
    </div>, document.body) : null}
  </>;
}
