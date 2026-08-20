import { describe, expect, it } from "vitest";
import { allValues, firstValue, toLinkQuery } from "./url-utils";

describe("toLinkQuery", () => {
  it("keeps every value of a repeated key", () => {
    // Los filtros del catálogo son multi-selección: perder repeticiones
    // significa que marcar dos categorías filtre por una sola.
    const params = new URLSearchParams();
    params.append("category", "Frenos");
    params.append("category", "Filtros");
    params.append("q", "toyota");

    expect(toLinkQuery(params)).toEqual({
      category: ["Frenos", "Filtros"],
      q: "toyota",
    });
  });

  it("does not lose values the way Object.fromEntries does", () => {
    const params = new URLSearchParams("brand=Bosch&brand=NGK&brand=WIX");

    expect(Object.fromEntries(params)).toEqual({ brand: "WIX" });
    expect(toLinkQuery(params)).toEqual({ brand: ["Bosch", "NGK", "WIX"] });
  });

  it("collapses a single value to a plain string", () => {
    expect(toLinkQuery(new URLSearchParams("sort=price-asc"))).toEqual({ sort: "price-asc" });
  });

  it("returns an empty object for empty params", () => {
    expect(toLinkQuery(new URLSearchParams())).toEqual({});
  });

  it("preserves empty string values", () => {
    expect(toLinkQuery(new URLSearchParams("q="))).toEqual({ q: "" });
  });
});

describe("firstValue", () => {
  it("normalizes the shapes the App Router can deliver", () => {
    expect(firstValue("toyota")).toBe("toyota");
    expect(firstValue(["toyota", "nissan"])).toBe("toyota");
    expect(firstValue(undefined)).toBe("");
    expect(firstValue([])).toBe("");
  });
});

describe("allValues", () => {
  it("normalizes, trims and drops the empty ones", () => {
    expect(allValues(["  Frenos ", "", "Filtros"])).toEqual(["Frenos", "Filtros"]);
    expect(allValues("Frenos")).toEqual(["Frenos"]);
    expect(allValues(undefined)).toEqual([]);
  });
});
