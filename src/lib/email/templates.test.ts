import { describe, expect, it, vi } from "vitest";
import {
  buildAbsoluteAppUrl,
  buildOrderConfirmationEmail,
  buildPasswordResetEmail,
} from "./templates";

const ORDER = {
  customerEmail: "cliente@example.com",
  customerName: "Cliente Demo",
  orderNumber: "CAP-20260520-ABC123",
  orderUrl: "https://example.com/es/orders/CAP-20260520-ABC123",
  totalCents: 1295,
};

describe("email templates", () => {
  it("builds order confirmation email content", () => {
    const email = buildOrderConfirmationEmail({ ...ORDER, locale: "es" });

    expect(email.to).toBe("cliente@example.com");
    expect(email.subject).toContain("CAP-20260520-ABC123");
    expect(email.text).toContain("$12.95");
    expect(email.html).toContain("Ver estado de la orden");
  });

  /**
   * El correo de confirmación se dispara desde el webhook del proveedor de
   * pagos: no hay request, ni cookie del cliente, ni árbol de React. Que este
   * test corra sin montar nada alrededor es la prueba de que el armado del
   * correo no depende de ninguna de esas tres cosas.
   */
  it("speaks the language the order was placed in, with no request around", () => {
    const email = buildOrderConfirmationEmail({ ...ORDER, locale: "en" });

    expect(email.subject).toContain("Order confirmation");
    expect(email.text).toContain("We received your order");
    expect(email.html).toContain("View order status");
  });

  it("keeps the currency in USD in both languages", () => {
    // El Salvador está dolarizado: el idioma cambia el formato, no la moneda.
    const spanish = buildOrderConfirmationEmail({ ...ORDER, locale: "es" });
    const english = buildOrderConfirmationEmail({ ...ORDER, locale: "en" });

    expect(spanish.text).toContain("$12.95");
    expect(english.text).toContain("$12.95");
  });

  it("builds the password reset email in the requested language", () => {
    const input = {
      email: "cliente@example.com",
      resetUrl: "https://example.com/en/auth/reset-password/token",
      locale: "en" as const,
    };

    const email = buildPasswordResetEmail(input);

    expect(email.to).toBe("cliente@example.com");
    expect(email.subject).toContain("Reset your password");
    expect(email.text).toContain(input.resetUrl);
    expect(email.html).toContain("If you did not request this");
  });
});

describe("buildAbsoluteAppUrl", () => {
  it("prefixes the path with the language of the recipient", () => {
    // Un enlace sin prefijo funciona por el redirect permanente, pero ese
    // redirect lleva siempre a español: quien compró en inglés abriría su orden
    // en el idioma equivocado desde su propio correo.
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://castillo.example");

    expect(buildAbsoluteAppUrl("/orders/CAP-1", "es")).toBe(
      "https://castillo.example/es/orders/CAP-1",
    );
    expect(buildAbsoluteAppUrl("/orders/CAP-1", "en")).toBe(
      "https://castillo.example/en/orders/CAP-1",
    );

    vi.unstubAllEnvs();
  });

  it("falls back to the main language when none is given", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://castillo.example");

    expect(buildAbsoluteAppUrl("/orders/CAP-1")).toBe("https://castillo.example/es/orders/CAP-1");

    vi.unstubAllEnvs();
  });
});
