import { describe, expect, it } from "vitest";
import { negotiateLocale } from "./landing-locale";

describe("negociación de idioma de la landing", () => {
  it("sin cabecera usa el idioma principal", () => {
    expect(negotiateLocale(null)).toBe("es");
    expect(negotiateLocale("")).toBe("es");
  });

  it("ignora la variante regional", () => {
    // El caso tiene que ser una variante **sin** el idioma suelto al lado y
    // distinta del principal: con `en-US,en` o con `es-419` la prueba pasa
    // igual aunque no se recorte la región —una porque encuentra `en` en el
    // segundo lugar, la otra porque cae al español por defecto, que es la
    // respuesta esperada—. `en-GB` solo da inglés si la región se recorta.
    expect(negotiateLocale("en-GB")).toBe("en");
    expect(negotiateLocale("en-US,en;q=0.9")).toBe("en");
  });

  it("respeta el orden de preferencia y no el de aparición", () => {
    // El primero de la lista no gana por estar primero: gana el de mayor `q`.
    expect(negotiateLocale("fr;q=1.0, en;q=0.9, es;q=0.95")).toBe("es");
    expect(negotiateLocale("es;q=0.3, en;q=0.8")).toBe("en");
  });

  it("asume calidad 1 cuando no viene declarada", () => {
    // Es lo que dice la especificación; tratarla como 0 daría vuelta el orden.
    expect(negotiateLocale("en, es;q=0.9")).toBe("en");
  });

  it("descarta los idiomas rechazados con q=0", () => {
    expect(negotiateLocale("en;q=0, es;q=0.5")).toBe("es");
  });

  it("cae al principal si no hay ninguno que se hable", () => {
    expect(negotiateLocale("fr-FR,de;q=0.8")).toBe("es");
  });

  it("no se rompe con una cabecera malformada", () => {
    // Llega de afuera: una cabecera rara no puede tumbar la página que existe
    // para recibir el tráfico del anuncio.
    expect(negotiateLocale(";;;")).toBe("es");
    expect(negotiateLocale("en;q=abc")).toBe("es");
    expect(negotiateLocale(",,en,,")).toBe("en");
  });
});
