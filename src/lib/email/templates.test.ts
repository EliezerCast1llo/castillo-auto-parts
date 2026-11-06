import { describe, expect, it, vi } from "vitest";
import {
  buildAbsoluteAppUrl,
  buildOrderConfirmationEmail,
  buildPasswordResetEmail,
  buildTwoFactorCodeEmail,
} from "./templates";

const ORDER = {
  customerEmail: "cliente@example.com",
  customerName: "Cliente Demo",
  fulfillmentMethod: "LOCAL_DELIVERY" as const,
  items: [
    { lineTotalCents: 995, name: "Filtro de aceite Toyota 1.8L", quantity: 1, sku: "MOCK-FIL-TOY-18" },
    { lineTotalCents: 300, name: "Bujía iridio", quantity: 2, sku: "MOCK-SPK-HK-16" },
  ],
  orderNumber: "CAP-20260520-ABC123",
  orderUrl: "https://example.com/es/orders/CAP-20260520-ABC123",
  shippingCents: 300,
  subtotalCents: 995,
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

  it("lleva el resumen de la compra, no solo el total", () => {
    // El correo era cinco líneas sin una sola línea de producto: quien compraba
    // recibía un monto y un link, y tenía que abrir la orden para saber qué
    // había comprado.
    const email = buildOrderConfirmationEmail({ ...ORDER, locale: "es" });

    for (const campo of [email.text, email.html]) {
      expect(campo).toContain("Filtro de aceite Toyota 1.8L");
      expect(campo).toContain("MOCK-FIL-TOY-18");
      expect(campo).toContain("Bujía iridio");
      expect(campo).toContain("Resumen de tu compra");
    }

    // Desglose completo: productos, envío y total, no solo el último.
    expect(email.text).toContain("$9.95");
    expect(email.text).toContain("$3.00");
    expect(email.text).toContain("$12.95");
  });

  it("nombra el método de entrega en el idioma de la compra", () => {
    // El nombre sale del namespace `Orders`, que ya lo tenía en los dos
    // idiomas: duplicarlo en `Email` habría dejado dos textos para lo mismo.
    expect(buildOrderConfirmationEmail({ ...ORDER, locale: "es" }).text).toContain(
      "Entrega a domicilio",
    );
    expect(buildOrderConfirmationEmail({ ...ORDER, locale: "en" }).text).toContain(
      "Home delivery",
    );
  });

  it("dice que el envío es gratis en vez de mostrar $0.00", () => {
    // Retiro en bodega cuesta cero, y leerlo como monto hace dudar de si se
    // cobró algo.
    const email = buildOrderConfirmationEmail({
      ...ORDER,
      fulfillmentMethod: "PICKUP",
      locale: "es",
      shippingCents: 0,
    });

    expect(email.text).toContain("Gratis");
    expect(email.text).not.toContain("$0.00");
  });

  it("omite el método de entrega cuando la orden todavía no tiene envío", () => {
    // `Shipment.method` es String en el schema: lo desconocido llega como null
    // y el correo calla, en vez de mostrarle un valor crudo al cliente.
    const email = buildOrderConfirmationEmail({ ...ORDER, fulfillmentMethod: null, locale: "es" });

    expect(email.text).not.toContain("Método de entrega");
    expect(email.html).not.toContain("Método de entrega");
  });

  it("no rompe con una orden sin líneas", () => {
    const email = buildOrderConfirmationEmail({ ...ORDER, items: [], locale: "es" });

    expect(email.html).toContain("Ver estado de la orden");
    expect(email.text).toContain("$12.95");
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

  describe("código de segundo factor", () => {
    const INPUT = {
      code: "048213",
      customerEmail: "cliente@example.com",
      customerName: "Cliente Demo",
      expiresInMinutes: 10,
    };

    it("pone el código en el asunto y en el cuerpo", () => {
      // En el asunto para que se lea desde la notificación del teléfono, que
      // es cómo se usa en la práctica.
      const email = buildTwoFactorCodeEmail({ ...INPUT, locale: "es" });

      expect(email.subject).toContain("048213");
      expect(email.text).toContain("048213");
      expect(email.html).toContain("048213");
    });

    it("no lleva ningún enlace", () => {
      // Un correo de autenticación con un link es la forma exacta que imita el
      // phishing: acostumbrar al cliente a hacer clic ahí trabaja contra lo
      // que este correo intenta proteger.
      const email = buildTwoFactorCodeEmail({ ...INPUT, locale: "es" });

      expect(email.html).not.toContain("<a ");
      expect(email.html).not.toContain("http");
      expect(email.text).not.toContain("http");
    });

    it("habla el idioma pedido", () => {
      expect(buildTwoFactorCodeEmail({ ...INPUT, locale: "es" }).text).toContain(
        "Usa este código",
      );
      expect(buildTwoFactorCodeEmail({ ...INPUT, locale: "en" }).text).toContain(
        "Use this code",
      );
    });

    it("dice cuánto dura, con el valor que recibe", () => {
      // El texto no repite la constante del módulo: si la vida del código
      // cambia, el correo lo dice solo.
      const email = buildTwoFactorCodeEmail({ ...INPUT, expiresInMinutes: 3, locale: "es" });

      expect(email.text).toContain("3 minutos");
      expect(email.text).not.toContain("10 minutos");
    });
  });
});