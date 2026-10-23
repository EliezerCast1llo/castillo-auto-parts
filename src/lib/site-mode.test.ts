import { describe, expect, it } from "vitest";
import { isLandingMode, sitePageExtensions } from "./site-mode";

describe("temporary landing route selection", () => {
  it.each([undefined, "", "store", "LANDING", "landing "])("preserves Next defaults for %s", (mode) => {
    expect(isLandingMode({ SITE_MODE: mode })).toBe(false);
    expect(sitePageExtensions({ SITE_MODE: mode })).toBeUndefined();
  });
  it("selects only landing routes and hooks with the exact opt-in", () => {
    expect(isLandingMode({ SITE_MODE: "landing" })).toBe(true);
    expect(sitePageExtensions({ SITE_MODE: "landing" })).toEqual(["landing.tsx", "landing.ts"]);
  });
});
