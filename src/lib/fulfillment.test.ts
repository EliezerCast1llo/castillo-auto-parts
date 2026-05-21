import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsEmbedUrl,
  defaultDeliveryZones,
  getDeliveryFeeCents,
  isCoordinateInsideDeliveryZone,
  normalizeCoverageValue,
} from "./fulfillment";

describe("fulfillment helpers", () => {
  it("normalizes city names for coverage checks", () => {
    expect(normalizeCoverageValue("  San Salvador ")).toBe("san salvador");
    expect(normalizeCoverageValue("Santa Técla")).toBe("santa tecla");
  });

  it("finds delivery fee from active zones", () => {
    expect(getDeliveryFeeCents("Santa Tecla", defaultDeliveryZones)).toBe(200);
    expect(getDeliveryFeeCents("San Salvador", defaultDeliveryZones)).toBe(300);
    expect(getDeliveryFeeCents("Soyapango", defaultDeliveryZones)).toBeNull();
  });

  it("ignores inactive zones", () => {
    expect(
      getDeliveryFeeCents("Santa Tecla", [
        {
          ...defaultDeliveryZones[0],
          isActive: false,
        },
      ]),
    ).toBeNull();
  });

  it("uses coordinates when building a map URL", () => {
    expect(
      buildGoogleMapsEmbedUrl({
        address: "Bodega principal",
        latitude: 13.6929,
        longitude: -89.2182,
      }),
    ).toContain("13.6929%2C-89.2182");
  });

  it("checks coordinates against known delivery zone bounds", () => {
    expect(
      isCoordinateInsideDeliveryZone({
        latitude: 13.6769,
        longitude: -89.2797,
        zone: defaultDeliveryZones[0],
      }),
    ).toBe(true);
    expect(
      isCoordinateInsideDeliveryZone({
        latitude: 13.6769,
        longitude: -88.9,
        zone: defaultDeliveryZones[0],
      }),
    ).toBe(false);
  });
});
