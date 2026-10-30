"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { PackageCheck } from "lucide-react";
import { useFormStatus } from "react-dom";

const CheckoutShippingState = createContext({ blocked: false, setBlocked: (value: boolean) => { void value; } });
export const useCheckoutShippingState = () => useContext(CheckoutShippingState);
export function CheckoutFormState({ action, children }: { action: (form: FormData) => Promise<void>; children: ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  return <CheckoutShippingState.Provider value={{ blocked, setBlocked }}><form action={action} className="space-y-4">{children}</form></CheckoutShippingState.Provider>;
}
export function CheckoutPayButton({ children }: { children: ReactNode }) {
  const { blocked } = useCheckoutShippingState();
  const { pending } = useFormStatus();
  return <button disabled={blocked || pending} className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-ca-navy-950 text-sm font-black text-white shadow-ca-button-hover transition hover:bg-ca-navy-800 disabled:opacity-50">
    <PackageCheck className="h-4 w-4" strokeWidth={2} />{children}
  </button>;
}
