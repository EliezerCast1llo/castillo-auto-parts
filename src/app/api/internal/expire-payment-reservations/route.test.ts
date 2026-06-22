import { describe, expect, it } from "vitest";
import { isValidBearerToken } from "./route";

describe("reservation expiration authorization", () => {
  it("accepts only an exact bearer secret", () => {
    expect(isValidBearerToken("Bearer cron-secret", "cron-secret")).toBe(true);
    expect(isValidBearerToken("Bearer wrong-secret", "cron-secret")).toBe(false);
    expect(isValidBearerToken("cron-secret", "cron-secret")).toBe(false);
    expect(isValidBearerToken(null, "cron-secret")).toBe(false);
  });
});
