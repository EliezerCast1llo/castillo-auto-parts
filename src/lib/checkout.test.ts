import { describe, expect, it } from "vitest";
import {
  buildOrderNumber,
  calculateIncludedTaxCents,
  calculateShippingCents,
  checkoutSchema,
  parseCheckoutFormData,
} from "./checkout";

describe("checkout helpers", () => {
  it("calculates delivery fee by coverage city", () => {
    expect(calculateShippingCents("PICKUP")).toBe(0);
    expect(calculateShippingCents("LOCAL_DELIVERY", "Santa Tecla")).toBe(200);
    expect(calculateShippingCents("LOCAL_DELIVERY", "San Salvador")).toBe(300);
    expect(calculateShippingCents("LOCAL_DELIVERY", "Soyapango")).toBeNull();
  });

  it("calculates included IVA from total", () => {
    expect(calculateIncludedTaxCents(11300)).toBe(1300);
  });

  it("requires address fields for local delivery", () => {
    const parsed = checkoutSchema.safeParse({
      customerEmail: "cliente@example.com",
      customerName: "Cliente Demo",
      customerPhone: "7777-7777",
      fulfillmentMethod: "LOCAL_DELIVERY",
      paymentMethod: "online_card",
    });

    expect(parsed.success).toBe(false);
  });

  it("allows pickup without delivery address fields", () => {
    const parsed = checkoutSchema.safeParse({
      customerEmail: "cliente@example.com",
      customerName: "Cliente Demo",
      customerPhone: "7777-7777",
      fulfillmentMethod: "PICKUP",
      paymentMethod: "online_card",
    });

    expect(parsed.success).toBe(true);
  });

  it("parses absent pickup address fields as optional values", () => {
    const formData = new FormData();
    formData.set("customerEmail", "cliente@example.com");
    formData.set("customerName", "Cliente Demo");
    formData.set("customerPhone", "7777-7777");
    formData.set("fulfillmentMethod", "PICKUP");
    formData.set("paymentMethod", "online_card");

    const parsed = parseCheckoutFormData(formData);

    expect(parsed.success).toBe(true);
  });

  it("builds deterministic order numbers", () => {
    expect(buildOrderNumber(new Date("2026-05-19T12:00:00Z"), "ABC123")).toBe(
      "CAP-20260519-ABC123",
    );
  });
});
