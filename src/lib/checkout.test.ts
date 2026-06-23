import { describe, expect, it } from "vitest";
import {
  buildOrderNumber,
  calculateIncludedTaxCents,
  calculateOrderTaxCents,
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

  it("composes order IVA from line taxes and tax-included shipping", () => {
    const itemTaxCents = [
      calculateIncludedTaxCents(1195),
      calculateIncludedTaxCents(1195),
    ];

    expect(
      calculateOrderTaxCents({
        itemTaxCents,
        shippingCents: 200,
      }),
    ).toBe(297);
  });

  it("does not recalculate order IVA from the gross total", () => {
    const productACents = 1195;
    const productBCents = 1195;
    const shippingCents = 200;

    const composedTaxCents = calculateOrderTaxCents({
      itemTaxCents: [
        calculateIncludedTaxCents(productACents),
        calculateIncludedTaxCents(productBCents),
      ],
      shippingCents,
    });

    expect(composedTaxCents).toBe(297);
    expect(calculateIncludedTaxCents(productACents + productBCents + shippingCents)).toBe(298);
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

  it("requires a configured delivery zone for local delivery", () => {
    const parsed = checkoutSchema.safeParse({
      addressLine1: "Calle principal",
      customerEmail: "cliente@example.com",
      customerName: "Cliente Demo",
      customerPhone: "7777-7777",
      fulfillmentMethod: "LOCAL_DELIVERY",
      paymentMethod: "online_card",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires map coordinates for local delivery", () => {
    const parsed = checkoutSchema.safeParse({
      addressLine1: "Calle principal",
      customerEmail: "cliente@example.com",
      customerName: "Cliente Demo",
      customerPhone: "7777-7777",
      deliveryZoneSlug: "santa-tecla",
      fulfillmentMethod: "LOCAL_DELIVERY",
      paymentMethod: "online_card",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts local delivery with address, delivery zone and map coordinates", () => {
    const parsed = checkoutSchema.safeParse({
      addressLine1: "Calle principal",
      customerEmail: "cliente@example.com",
      customerName: "Cliente Demo",
      customerPhone: "7777-7777",
      deliveryZoneSlug: "santa-tecla",
      fulfillmentMethod: "LOCAL_DELIVERY",
      latitude: "13.676900",
      longitude: "-89.279700",
      paymentMethod: "online_card",
    });

    expect(parsed.success).toBe(true);
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

  it("rejects unbounded checkout text fields", () => {
    const parsed = checkoutSchema.safeParse({
      customerEmail: "cliente@example.com",
      customerName: "Cliente Demo",
      customerPhone: "7777-7777",
      deliveryNotes: "x".repeat(501),
      fulfillmentMethod: "PICKUP",
      paymentMethod: "online_card",
    });

    expect(parsed.success).toBe(false);
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
