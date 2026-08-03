import { describe, expect, it } from "vitest";
import { canonicalizeVehicle, findCanonicalMake, splitMakeAndModel } from "./vehicle-catalog";

describe("vehicle catalog", () => {
  it("finds canonical makes case-insensitively and with extra spaces", () => {
    expect(findCanonicalMake("toyota")).toBe("Toyota");
    expect(findCanonicalMake("LAND  ROVER")).toBe("Land Rover");
    expect(findCanonicalMake("DeLorean")).toBeUndefined();
  });

  it("splits multi-word makes with longest-prefix match", () => {
    expect(splitMakeAndModel("Land Rover Defender")).toEqual({
      make: "Land Rover",
      model: "Defender",
    });
    expect(splitMakeAndModel("Alfa Romeo Giulietta")).toEqual({
      make: "Alfa Romeo",
      model: "Giulietta",
    });
  });

  it("falls back to first word for unknown makes", () => {
    expect(splitMakeAndModel("byd dolphin mini")).toEqual({
      make: "Byd",
      model: "dolphin mini",
    });
  });

  it("returns null when there is no model", () => {
    expect(splitMakeAndModel("Toyota")).toBeNull();
  });

  it("canonicalizes make and preserves model casing", () => {
    expect(canonicalizeVehicle({ make: " toyota ", model: " Corolla  Cross " })).toEqual({
      make: "Toyota",
      model: "Corolla Cross",
    });
    expect(canonicalizeVehicle({ make: "honda", model: "CR-V" })).toEqual({
      make: "Honda",
      model: "CR-V",
    });
  });
});
