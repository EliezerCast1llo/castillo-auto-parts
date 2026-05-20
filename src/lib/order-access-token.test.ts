import { describe, expect, it } from "vitest";
import {
  buildOrderAccessHref,
  createOrderAccessToken,
  hashOrderAccessToken,
  verifyOrderAccessToken,
} from "./order-access-token";

describe("order access tokens", () => {
  it("creates verifiable non-plain-text access tokens", () => {
    const token = createOrderAccessToken();
    const hash = hashOrderAccessToken(token);

    expect(token.length).toBeGreaterThan(32);
    expect(hash).not.toBe(token);
    expect(verifyOrderAccessToken(token, hash)).toBe(true);
    expect(verifyOrderAccessToken("wrong-token", hash)).toBe(false);
  });

  it("rejects missing access token values", () => {
    expect(verifyOrderAccessToken(undefined, hashOrderAccessToken("token"))).toBe(false);
    expect(verifyOrderAccessToken("token", null)).toBe(false);
  });

  it("builds order URLs with access token query parameters", () => {
    expect(buildOrderAccessHref("CAP-20260520-ABC123", "secret-token")).toBe(
      "/orders/CAP-20260520-ABC123?token=secret-token",
    );
  });
});
