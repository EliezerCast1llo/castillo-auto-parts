"use client";

import { buttonVariants } from "@/components/ui/button";
import { createContext, useContext, useState, type ReactNode } from "react";
import { PackageCheck } from "lucide-react";
import { useFormStatus } from "react-dom";

const CheckoutShippingState = createContext({ blocked: false, setBlocked: (value: boolean) => { void value; } });
export const useCheckoutShippingState = () => useContext(CheckoutShippingState);
export function CheckoutFormState({ action, children }: { action: (form: FormData) => Promise<void>; children: ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  return <CheckoutShippingState.Provider value={{ blocked, setBlocked }}><form action={action} className="space-y-4" onSubmit={(event) => {
    const fields = new FormData(event.currentTarget);
    if (fields.get("fulfillmentMethod") === "NATIONAL_SHIPPING" && Number(fields.get("shippingQuoteExpiresAt")) <= Date.now()) {
      event.preventDefault(); setBlocked(true); window.dispatchEvent(new Event("shipping-quote-expired"));
    }
  }}>{children}</form></CheckoutShippingState.Provider>;
}
export function CheckoutPayButton({ children }: { children: ReactNode }) {
  const { blocked } = useCheckoutShippingState();
  const { pending } = useFormStatus();
  return <button disabled={blocked || pending} className={buttonVariants({ size: "lg", className: "w-full" })}>
    <PackageCheck className="h-4 w-4" strokeWidth={2} />{children}
  </button>;
}
