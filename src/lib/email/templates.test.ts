import { describe, expect, it, vi } from "vitest";
import { buildAbsoluteAppUrl, buildOrderConfirmationEmail } from "./templates";

describe("email templates", () => {
  it("builds order confirmation email content", () => {
    const email = buildOrderConfirmationEmail({
      customerEmail: "cliente@example.com",
      customerName: "Cliente Demo",
      orderNumber: "CAP-20260520-ABC123",
      orderUrl: "https://example.com/orders/CAP-20260520-ABC123",
      totalCents: 1295,
    });

    expect(email.to).toBe("cliente@example.com");
    expect(email.subject).toContain("CAP-20260520-ABC123");
    expect(email.text).toContain("$12.95");
    expect(email.html).toContain("Ver estado de la orden");
  });

  it("builds absolute app URLs from configured base URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://castillo.example");

    expect(buildAbsoluteAppUrl("/orders/CAP-1")).toBe("https://castillo.example/orders/CAP-1");

    vi.unstubAllEnvs();
  });
});
