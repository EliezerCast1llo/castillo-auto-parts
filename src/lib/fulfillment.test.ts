import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsEmbedUrl,
  defaultDeliveryZones,
  getDeliveryFeeCents,
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
});
