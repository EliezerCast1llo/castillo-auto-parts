"use client";

import { useCheckoutShippingState } from "./checkout-form-state";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/money";
import type { PickupLocationOption } from "@/lib/fulfillment";
import { shippingRateKey, type ShippingRate } from "@/lib/shipping";
import { isNationalAddress, isNationalCoordinate } from "@/data/el-salvador";
import { CheckoutLocationPicker } from "./checkout-location-picker";
import { emptyNationalAddress, NationalAddressInputs, type NationalAddressFields } from "./national-address-fields";

type SavedAddress = { id: string; addressLine1: string; addressLine2: string | null; city: string; department: string; landmark: string | null; deliveryNotes: string | null; latitude: string | null; longitude: string | null };
type Rate = ShippingRate & { chargedCents: number };

export function CheckoutDeliveryFields({ pickupLocation, savedAddresses, subtotalCents, cartDetail, shippingConfigured }: {
  shippingConfigured: boolean; pickupLocation: PickupLocationOption; savedAddresses: SavedAddress[]; subtotalCents: number; cartDetail: string;
}) {
  const t = useTranslations("Checkout.delivery");
  const locale = useLocale();
  const { setBlocked } = useCheckoutShippingState();
  const [method, setMethod] = useState("PICKUP");
  const [address, setAddress] = useState<NationalAddressFields>(emptyNationalAddress);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }>();
  const [rates, setRates] = useState<Rate[]>([]);
  const [option, setOption] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [mapKey, setMapKey] = useState(0);
  const revision = useRef(0);
  const selectedRate = rates.find((rate) => shippingRateKey(rate) === option);
  const canQuote = shippingConfigured && Boolean(address.addressLine1.trim() && address.landmark.trim() && isNationalAddress(address.department, address.city) && isNationalCoordinate(coordinates?.latitude, coordinates?.longitude));
  function invalidate(nextMethod = method) { setBlocked(nextMethod !== "PICKUP"); revision.current++; setRates([]); setOption(""); setStatus("idle"); }
  async function quote() {
    const current = ++revision.current;
    setStatus("loading"); setOption(""); setRates([]);
    try {
      const response = await fetch("/api/shipping/rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...address, ...coordinates }) });
      const data = await response.json();
      if (revision.current !== current) return;
      const next: Rate[] = response.ok && Array.isArray(data.rates) ? data.rates : [];
      setRates(next); setStatus(next.length ? "ready" : "unavailable");
    } catch { if (revision.current === current) setStatus("unavailable"); }
  }
  const whatsapp = `https://wa.me/50378907671?text=${encodeURIComponent(`${t("whatsappRequest")}\n${cartDetail}\n${address.city}, ${address.department}`)}`;
  return <div className="mt-4 space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      {(["PICKUP", "NATIONAL_SHIPPING"] as const).map((value) => <label className="flex min-h-12 items-center gap-3 rounded-xl border border-ca-border px-3 font-semibold" key={value}>
        <input type="radio" name="fulfillmentMethod" value={value} checked={method === value} onChange={() => { setMethod(value); invalidate(value); }} />
        {t(value === "PICKUP" ? "pickup" : "nationalShipping")}
      </label>)}
    </div>
    {method === "PICKUP" ? <div className="rounded-xl bg-ca-background p-4 text-sm">
      <h3 className="font-bold">{t("pickup")}</h3>
      <p className="font-bold">{pickupLocation.name} · {t("pickupCost", { amount: formatCurrency(0, locale) })}</p>
      <p>{pickupLocation.address}</p><p>{pickupLocation.pickupHours}</p><p>{pickupLocation.pickupInstructions}</p>
      <iframe title={t("warehouseMapTitle")} src={pickupLocation.mapUrl} className="mt-3 h-56 w-full rounded-xl border-0" loading="lazy" />
    </div> : <>
      {savedAddresses.length ? <label className="block text-sm font-semibold">{t("savedAddress")}
        <select className="mt-2 min-h-11 w-full rounded-xl border p-2" defaultValue="" onChange={(e) => {
          const saved = savedAddresses.find((item) => item.id === e.target.value);
          invalidate();
          setAddress(saved ? { addressLine1: saved.addressLine1, addressLine2: saved.addressLine2 ?? "", city: isNationalAddress(saved.department, saved.city) ? saved.city : "", department: saved.department, landmark: saved.landmark ?? "", deliveryNotes: saved.deliveryNotes ?? "" } : emptyNationalAddress);
          setCoordinates(saved?.latitude && saved.longitude ? { latitude: Number(saved.latitude), longitude: Number(saved.longitude) } : undefined);
          setMapKey((key) => key + 1);
        }}><option value="">{t("newAddress")}</option>{savedAddresses.map((item) => <option key={item.id} value={item.id}>{item.addressLine1}, {item.city}</option>)}</select>
      </label> : null}
      <NationalAddressInputs value={address} onChange={(next) => { invalidate(); setAddress(next); }} />
      <CheckoutLocationPicker key={mapKey} initialCoordinates={coordinates} onCoordinatesChange={(next) => { invalidate(); setCoordinates(next); }} />
      <button type="button" disabled={!canQuote || status === "loading"} onClick={quote} className="min-h-11 rounded-xl bg-ca-navy-950 px-4 font-bold text-white disabled:opacity-50">{t(status === "loading" ? "quoting" : "quote")}</button>
      <input type="hidden" name="shippingOption" value={option} />
      <div aria-live="polite" className="space-y-3">
        {rates.map((rate) => <label key={shippingRateKey(rate)} className="flex min-h-12 items-center gap-3 rounded-xl border p-3">
          <input type="radio" name="shippingRateChoice" required checked={option === shippingRateKey(rate)} onChange={() => { setOption(shippingRateKey(rate)); setBlocked(false); }} />
          <span>{rate.courierName} · {t(rate.serviceType === "same-day" ? "sameDay" : "nextDay")} · {formatCurrency(rate.chargedCents, locale)}
            {rate.chargedCents === 0 ? ` (${t("promotion")})` : ""}
            {rate.estimatedDeliveryAt ? ` · ${new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "America/El_Salvador" }).format(new Date(rate.estimatedDeliveryAt))}` : ""}
          </span>
        </label>)}
        {status === "unavailable" || !shippingConfigured ? <p role="alert">{t("unavailable")} <a className="font-bold underline" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a></p> : null}
      </div>

    </>}
    <div className="rounded-xl bg-ca-background p-4 text-sm" aria-live="polite">
      <p>{t("totalsProducts")}: {formatCurrency(subtotalCents, locale)}</p>
      <p>{t("totalsShipping")}: {method === "PICKUP" ? formatCurrency(0, locale) : selectedRate ? formatCurrency(selectedRate.chargedCents, locale) : t("pendingQuote")}</p>
      <p className="mt-2 font-bold">{t("totalsEstimated")}: {method === "PICKUP" || selectedRate ? formatCurrency(subtotalCents + (selectedRate?.chargedCents ?? 0), locale) : t("pendingQuote")}</p>
    </div>
  </div>;
}
