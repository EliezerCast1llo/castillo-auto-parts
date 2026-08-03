"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readMyVehicleFromDocument, type MyVehicle } from "@/lib/my-vehicle";

const emptySubscribe = () => () => {};

/**
 * Lee "mi vehículo" desde la cookie de forma hidratación-segura:
 * en servidor devuelve null; en cliente, el valor real tras montar.
 */
export function useMyVehicle(): MyVehicle | null {
  const cookieSource = useSyncExternalStore(
    emptySubscribe,
    () => document.cookie,
    () => "",
  );

  return useMemo(() => readMyVehicleFromDocument(cookieSource), [cookieSource]);
}
