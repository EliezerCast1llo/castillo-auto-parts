import "server-only";
import { cookies } from "next/headers";
import { MY_VEHICLE_COOKIE, parseMyVehicleCookie, type MyVehicle } from "./my-vehicle";

/** Lee "mi vehículo" desde la cookie en un server component / action. */
export async function getMyVehicle(): Promise<MyVehicle | null> {
  const cookieStore = await cookies();
  return parseMyVehicleCookie(cookieStore.get(MY_VEHICLE_COOKIE)?.value);
}
