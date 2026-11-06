import { describe, expect, it } from "vitest";
import { maskEmail } from "./customer-credentials";

describe("maskEmail", () => {
  it("deja la primera letra y el dominio", () => {
    expect(maskEmail("eliezer@gmail.com")).toBe("e••••••@gmail.com");
  });

  it("oculta algo incluso cuando la parte local es de una letra", () => {
    // Sin el mínimo, "a@x.com" saldría tal cual y el enmascarado no ocultaría
    // nada: quien lee la pantalla tendría el correo completo.
    expect(maskEmail("a@x.com")).toBe("a•@x.com");
  });

  it("usa la última arroba, no la primera", () => {
    expect(maskEmail("raro@cosa@dominio.com")).toBe("r••••••••@dominio.com");
  });

  it("no muestra un valor que no entendió", () => {
    expect(maskEmail("sin-arroba")).toBe("•••");
    expect(maskEmail("@solo-dominio.com")).toBe("•••");
    expect(maskEmail("")).toBe("•••");
  });
});
