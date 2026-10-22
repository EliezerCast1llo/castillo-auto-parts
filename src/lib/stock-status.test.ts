import { describe, expect, it } from "vitest";
import {
  formatStockStatus,
  isLegacyStockStatusParam,
  isStockStatus,
  parseStockStatusParam,
  stockStatuses,
} from "./stock-status";

describe("isStockStatus", () => {
  it("accepts the canonical identifiers", () => {
    expect(stockStatuses.every(isStockStatus)).toBe(true);
  });

  it("rejects the legacy Spanish values", () => {
    expect(isStockStatus("Disponible")).toBe(false);
    expect(isStockStatus("Últimas unidades")).toBe(false);
  });

  it("rejects unknown values", () => {
    expect(isStockStatus("")).toBe(false);
    expect(isStockStatus("in_stock")).toBe(false);
  });
});

describe("parseStockStatusParam", () => {
  it("returns canonical identifiers unchanged", () => {
    expect(parseStockStatusParam("IN_STOCK")).toBe("IN_STOCK");
    expect(parseStockStatusParam("LOW_STOCK")).toBe("LOW_STOCK");
    expect(parseStockStatusParam("OUT_OF_STOCK")).toBe("OUT_OF_STOCK");
  });

  it("maps the legacy Spanish values shipped in catalog URLs", () => {
    expect(parseStockStatusParam("Disponible")).toBe("IN_STOCK");
    expect(parseStockStatusParam("Últimas unidades")).toBe("LOW_STOCK");
    expect(parseStockStatusParam("No disponible")).toBe("OUT_OF_STOCK");
  });

  it("tolerates accent, case and whitespace variants of the legacy values", () => {
    expect(parseStockStatusParam("ultimas unidades")).toBe("LOW_STOCK");
    expect(parseStockStatusParam("ÚLTIMAS UNIDADES")).toBe("LOW_STOCK");
    expect(parseStockStatusParam("  Últimas   unidades  ")).toBe("LOW_STOCK");
    expect(parseStockStatusParam("DISPONIBLE")).toBe("IN_STOCK");
  });

  it("handles the NFD form produced by some clients", () => {
    expect(parseStockStatusParam("Últimas unidades".normalize("NFD"))).toBe("LOW_STOCK");
  });

  it("returns null for unknown values", () => {
    expect(parseStockStatusParam("")).toBeNull();
    expect(parseStockStatusParam("agotado")).toBeNull();
    expect(parseStockStatusParam("IN STOCK")).toBeNull();
  });
});

describe("isLegacyStockStatusParam", () => {
  it("flags only the Spanish values so the catalog can canonicalize the URL", () => {
    expect(isLegacyStockStatusParam("Últimas unidades")).toBe(true);
    expect(isLegacyStockStatusParam("Disponible")).toBe(true);
    expect(isLegacyStockStatusParam("LOW_STOCK")).toBe(false);
    expect(isLegacyStockStatusParam("cualquier cosa")).toBe(false);
  });
});

describe("formatStockStatus", () => {
  it("still renders the Spanish copy the UI shipped before the refactor", () => {
    expect(formatStockStatus("IN_STOCK")).toBe("Disponible");
    expect(formatStockStatus("LOW_STOCK")).toBe("Últimas unidades");
    expect(formatStockStatus("OUT_OF_STOCK")).toBe("No disponible");
  });
});
