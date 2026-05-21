import { describe, expect, it } from "vitest";
import { redactSensitiveEmailText } from "./transactional";

describe("transactional email logs", () => {
  it("redacts order access tokens before persisting email payload text", () => {
    const text = "Ver estado: https://example.com/orders/CAP-1?token=secret-token";

    expect(redactSensitiveEmailText(text)).toBe(
      "Ver estado: https://example.com/orders/CAP-1?token=[redacted]",
    );
  });
});
