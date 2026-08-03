import { InventoryStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  formatAdminPriceInput,
  normalizeAdminInventoryStatus,
  parseAdminPriceCents,
  parseCompatibilityLines,
  parseTechnicalDetails,
  slugifyProductValue,
} from "./admin-products";

describe("admin product helpers", () => {
  it("creates stable product slugs", () => {
    expect(slugifyProductValue("Bujía Iridio Hyundai/Kia 1.6L")).toBe(
      "bujia-iridio-hyundai-kia-1-6l",
    );
  });

  it("parses and formats USD price values", () => {
    expect(parseAdminPriceCents("11.95")).toBe(1195);
    expect(parseAdminPriceCents("11,95")).toBe(1195);
    expect(parseAdminPriceCents("11.999")).toBeNull();
    expect(formatAdminPriceInput(1195)).toBe("11.95");
  });

  it("parses technical details from one line per item", () => {
    expect(parseTechnicalDetails("Venta por unidad\nValidar por VIN\n")).toEqual([
      "Venta por unidad",
      "Validar por VIN",
    ]);
  });

  it("parses vehicle compatibility lines", () => {
    expect(parseCompatibilityLines("Toyota Corolla 2009-2022\nNissan Sentra 2013-2020")).toEqual({
      invalidLines: [],
      items: [
        { make: "Toyota", model: "Corolla", yearFrom: 2009, yearTo: 2022 },
        { make: "Nissan", model: "Sentra", yearFrom: 2013, yearTo: 2020 },
      ],
    });
  });

  it("parses multi-word makes and canonicalizes casing", () => {
    expect(
      parseCompatibilityLines("Land Rover Defender 2015-2020\ntoyota   corolla cross 2021-2024"),
    ).toEqual({
      invalidLines: [],
      items: [
        { make: "Land Rover", model: "Defender", yearFrom: 2015, yearTo: 2020 },
        { make: "Toyota", model: "corolla cross", yearFrom: 2021, yearTo: 2024 },
      ],
    });
  });

  it("falls back to first word as make for unknown brands", () => {
    expect(parseCompatibilityLines("BYD Dolphin 2023-2025")).toEqual({
      invalidLines: [],
      items: [{ make: "Byd", model: "Dolphin", yearFrom: 2023, yearTo: 2025 }],
    });
  });

  it("returns invalid compatibility lines", () => {
    expect(parseCompatibilityLines("Corolla 2009\nToyota Yaris 2020-2010")).toEqual({
      invalidLines: ["Corolla 2009", "Toyota Yaris 2020-2010"],
      items: [],
    });
  });

  it("does not allow available status with zero stock", () => {
    expect(
      normalizeAdminInventoryStatus({
        quantityOnHand: 0,
        requestedStatus: InventoryStatus.IN_STOCK,
      }),
    ).toBe(InventoryStatus.OUT_OF_STOCK);
  });
});
