"use client";

import { buttonVariants } from "@/components/ui/button";
import { useCheckoutShippingState } from "./checkout-form-state";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/money";
import type { PickupLocationOption } from "@/lib/fulfillment";
import type { ShippingRate } from "@/lib/shipping";
import { shippingRateKey } from "@/lib/shipping-rate-key";
import { buildContactLinks } from "@/lib/contact";
import { isNationalAddress, isNationalCoordinate } from "@/data/el-salvador";
import { CheckoutLocationPicker } from "./checkout-location-picker";
import { emptyNationalAddress, NationalAddressInputs, type NationalAddressFields } from "./national-address-fields";

type SavedAddress = { id: string; addressLine1: string; addressLine2: string | null; city: string; department: string; landmark: string | null; deliveryNotes: string | null; latitude: string | null; longitude: string | null };
type Rate = ShippingRate & { chargedCents: number };

export function CheckoutDeliveryFields({ pickupLocation, savedAddresses, subtotalCents, cartDetail, shippingConfigured, boxfulLocations = [], requiresDistrict = false }: {
  boxfulLocations?: { cityId: string; department: string; municipality: string; district: string }[]; requiresDistrict?: boolean;
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
  const abort = useRef<AbortController | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chosenOption = useRef("");
  const [quoteToken, setQuoteToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [cityId, setCityId] = useState("");
  const { pending } = useFormStatus();
  const districtOptions = boxfulLocations.filter((l) => l.department === address.department && l.municipality === address.city);
  const selectedRate = rates.find((rate) => shippingRateKey(rate) === option);
  const canQuote = shippingConfigured && (!requiresDistrict || Boolean(cityId)) && Boolean(address.addressLine1.trim() && address.landmark.trim() && isNationalAddress(address.department, address.city) && isNationalCoordinate(coordinates?.latitude, coordinates?.longitude));
  function invalidate(nextMethod = method) { setBlocked(nextMethod !== "PICKUP"); revision.current++; abort.current?.abort(); chosenOption.current = ""; setQuoteToken(""); setExpiresAt(0); setRates([]); setOption(""); setStatus("idle"); }
  const quote = useCallback(async () => {
    if (!canQuote || pending || method !== "NATIONAL_SHIPPING") return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    abort.current?.abort();
    const controller = new AbortController(); abort.current = controller;
    setBlocked(true);
    const current = ++revision.current;
    setStatus("loading"); setQuoteToken("");
    try {
      const response = await fetch("/api/shipping/rates", { signal: controller.signal, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...address, ...coordinates, cityId: cityId || undefined }) });
      const data = await response.json();
      if (revision.current !== current) return;
      const next: Rate[] = response.ok && Array.isArray(data.rates) ? data.rates : [];
      setRates(next); setStatus(next.length ? "ready" : "unavailable");
      setQuoteToken(data.quoteToken || ""); setExpiresAt(data.expiresAt || 0);
      const retained = next.find((r) => shippingRateKey(r) === chosenOption.current);
      setOption(retained ? chosenOption.current : "");
      setBlocked(!retained || !data.quoteToken || data.expiresAt <= Date.now());
    } catch { if (revision.current === current) setStatus("unavailable"); }
  }, [address, coordinates, cityId, canQuote, pending, method, setBlocked]);
  // Quote once when the national destination is complete, then renew on expiry.
  useEffect(() => {
    if (!canQuote || pending || method !== "NATIONAL_SHIPPING") return;
    const timer = setTimeout(() => { void quote(); }, 400);
    autoTimer.current = timer;
    return () => { clearTimeout(timer); abort.current?.abort(); };
  }, [quote, canQuote, pending, method]);
  useEffect(() => {
    if (!expiresAt || pending || method !== "NATIONAL_SHIPPING") return;
    const timer = setTimeout(() => { void quote(); }, Math.max(0, expiresAt - Date.now()));
    const expired = () => { void quote(); };
    window.addEventListener("shipping-quote-expired", expired);
    return () => { clearTimeout(timer); window.removeEventListener("shipping-quote-expired", expired); };
  }, [expiresAt, pending, method, quote]);
  const whatsapp = buildContactLinks(undefined, `${t("whatsappRequest")}\n${cartDetail}\n${address.city}, ${address.department}`).whatsapp;
  return <div className="mt-4 space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      {(["PICKUP", "NATIONAL_SHIPPING"] as const).map((value) => <label className="flex min-h-12 items-center gap-3 rounded-ca-control border border-ca-border px-3 font-semibold" key={value}>
        <input type="radio" name="fulfillmentMethod" value={value} checked={method === value} onChange={() => { setMethod(value); invalidate(value); }} />
        {t(value === "PICKUP" ? "pickup" : "nationalShipping")}
      </label>)}
    </div>
    {method === "PICKUP" ? <div className="rounded-ca-control bg-ca-bg p-4 text-sm">
      <h3 className="font-bold">{t("pickup")}</h3>
      <p className="font-bold">{pickupLocation.name} · {t("pickupCost", { amount: formatCurrency(0, locale) })}</p>
      <p>{pickupLocation.address}</p><p>{pickupLocation.pickupHours}</p><p>{pickupLocation.pickupInstructions}</p>
      <iframe title={t("warehouseMapTitle")} src={pickupLocation.mapUrl} className="mt-3 h-56 w-full rounded-ca-control border-0" loading="lazy" />
    </div> : <>
      {savedAddresses.length ? <label className="block text-sm font-semibold">{t("savedAddress")}
        <select className="mt-2 min-h-11 w-full rounded-ca-control border p-2" defaultValue="" onChange={(e) => {
          const saved = savedAddresses.find((item) => item.id === e.target.value);
          invalidate(); setCityId("");
          setAddress(saved ? { addressLine1: saved.addressLine1, addressLine2: saved.addressLine2 ?? "", city: isNationalAddress(saved.department, saved.city) ? saved.city : "", department: saved.department, landmark: saved.landmark ?? "", deliveryNotes: saved.deliveryNotes ?? "" } : emptyNationalAddress);
          setCoordinates(saved?.latitude && saved.longitude ? { latitude: Number(saved.latitude), longitude: Number(saved.longitude) } : undefined);
          setMapKey((key) => key + 1);
        }}><option value="">{t("newAddress")}</option>{savedAddresses.map((item) => <option key={item.id} value={item.id}>{item.addressLine1}, {item.city}</option>)}</select>
      </label> : null}
      <NationalAddressInputs value={address} onChange={(next) => { invalidate(); setAddress(next); if (next.city !== address.city || next.department !== address.department) setCityId(""); }} />
      {requiresDistrict ? <label className="block text-sm font-semibold">{t("district")}
        <select name="shippingCityId" required value={cityId} className="mt-2 min-h-11 w-full rounded-ca-control border p-2" onChange={(e) => { invalidate(); setCityId(e.target.value); }}>
          <option value="">{t("selectDistrict")}</option>
          {districtOptions.map((l) => <option key={l.cityId} value={l.cityId}>{l.district}</option>)}
        </select>
      </label> : null}
      <CheckoutLocationPicker key={mapKey} initialCoordinates={coordinates} onCoordinatesChange={(next) => { invalidate(); setCoordinates(next); }} />
      <button type="button" disabled={!canQuote || status === "loading"} onClick={quote} className={buttonVariants()}>{t(status === "loading" ? "quoting" : "quote")}</button>
      <input type="hidden" name="shippingOption" value={option} />
      <input type="hidden" name="shippingQuoteToken" value={quoteToken} />
      <input type="hidden" name="shippingQuoteExpiresAt" value={expiresAt} />
      <div aria-live="polite" className="space-y-3">
        {rates.map((rate) => <label key={shippingRateKey(rate)} className="flex min-h-12 items-center gap-3 rounded-ca-control border p-3">
          <input type="radio" name="shippingRateChoice" required checked={option === shippingRateKey(rate)} disabled={status !== "ready" || !quoteToken} onChange={() => { if (expiresAt <= Date.now()) { void quote(); return; } const key = shippingRateKey(rate); chosenOption.current = key; setOption(key); setBlocked(false); }} />
          <span>{rate.courierName} · {t(rate.serviceType === "same-day" ? "sameDay" : "nextDay")} · {formatCurrency(rate.chargedCents, locale)}
            {rate.chargedCents === 0 ? ` (${t("promotion")})` : ""}
            {rate.estimatedDeliveryAt ? ` · ${new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "America/El_Salvador" }).format(new Date(rate.estimatedDeliveryAt))}` : ""}
          </span>
        </label>)}
        {status === "unavailable" || !shippingConfigured ? <p role="alert">{t("unavailable")} <a className="font-bold underline" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a></p> : null}
      </div>

    </>}
    <div className="rounded-ca-control bg-ca-bg p-4 text-sm" aria-live="polite">
      <p>{t("totalsProducts")}: {formatCurrency(subtotalCents, locale)}</p>
      <p>{t("totalsShipping")}: {method === "PICKUP" ? formatCurrency(0, locale) : selectedRate ? formatCurrency(selectedRate.chargedCents, locale) : t("pendingQuote")}</p>
      <p className="mt-2 font-bold">{t("totalsEstimated")}: {method === "PICKUP" || selectedRate ? formatCurrency(subtotalCents + (selectedRate?.chargedCents ?? 0), locale) : t("pendingQuote")}</p>
    </div>
  </div>;
}
