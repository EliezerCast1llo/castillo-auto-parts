import { describe, expect, it } from "vitest";
import { parseStockAlertFormData, parseStockAlertStatus } from "./stock-alerts";

describe("stock alerts", () => {
  it("accepts an email contact request", () => {
    const formData = new FormData();
    formData.set("sku", "MOCK-FIL-TOY-18");
    formData.set("customerEmail", "cliente@example.com");
    formData.set("requestedQuantity", "2");

    const parsed = parseStockAlertFormData(formData);

    expect(parsed.success).toBe(true);
  });

  it("accepts a phone contact request", () => {
    const formData = new FormData();
    formData.set("sku", "MOCK-FIL-TOY-18");
    formData.set("customerPhone", "7777-7777");

    const parsed = parseStockAlertFormData(formData);

    expect(parsed.success).toBe(true);
  });

  it("rejects missing contact details", () => {
    const formData = new FormData();
    formData.set("sku", "MOCK-FIL-TOY-18");

    const parsed = parseStockAlertFormData(formData);

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid SKUs", () => {
    const formData = new FormData();
    formData.set("sku", "bad sku");
    formData.set("customerEmail", "cliente@example.com");

    const parsed = parseStockAlertFormData(formData);

    expect(parsed.success).toBe(false);
  });

  it("parses known stock alert statuses", () => {
    expect(parseStockAlertStatus("OPEN")).toBe("OPEN");
    expect(parseStockAlertStatus("NOTIFIED")).toBe("NOTIFIED");
    expect(parseStockAlertStatus("UNKNOWN")).toBeNull();
  });
});
