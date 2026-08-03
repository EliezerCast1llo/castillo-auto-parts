import { describe, expect, it } from "vitest";
import {
  MY_VEHICLE_COOKIE,
  formatMyVehicle,
  parseMyVehicleCookie,
  readMyVehicleFromDocument,
  serializeMyVehicle,
} from "./my-vehicle";

describe("my vehicle cookie", () => {
  it("round-trips a full vehicle", () => {
    const vehicle = { make: "Toyota", model: "Corolla", year: "2018" };
    expect(parseMyVehicleCookie(serializeMyVehicle(vehicle))).toEqual(vehicle);
  });

  it("round-trips make-only selections", () => {
    expect(parseMyVehicleCookie(serializeMyVehicle({ make: "Nissan" }))).toEqual({
      make: "Nissan",
    });
  });

  it("rejects malformed or incomplete payloads", () => {
    expect(parseMyVehicleCookie(undefined)).toBeNull();
    expect(parseMyVehicleCookie("not-json")).toBeNull();
    expect(parseMyVehicleCookie(encodeURIComponent('{"model":"Corolla"}'))).toBeNull();
    expect(parseMyVehicleCookie(encodeURIComponent('"just a string"'))).toBeNull();
  });

  it("drops invalid years", () => {
    expect(
      parseMyVehicleCookie(encodeURIComponent(JSON.stringify({ make: "Kia", year: "20x8" }))),
    ).toEqual({ make: "Kia" });
  });

  it("reads the cookie from a document.cookie string", () => {
    const serialized = serializeMyVehicle({ make: "Honda", model: "Civic" });
    const cookieSource = `other=1; ${MY_VEHICLE_COOKIE}=${serialized}; session=abc`;

    expect(readMyVehicleFromDocument(cookieSource)).toEqual({ make: "Honda", model: "Civic" });
    expect(readMyVehicleFromDocument("other=1")).toBeNull();
  });

  it("formats the vehicle label", () => {
    expect(formatMyVehicle({ make: "Toyota", model: "Corolla", year: "2018" })).toBe(
      "Toyota Corolla 2018",
    );
    expect(formatMyVehicle({ make: "Toyota" })).toBe("Toyota");
  });
});
