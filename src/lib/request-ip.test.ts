import { describe, expect, it } from "vitest";
import { getClientIp } from "./request-ip";

function headers(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("getClientIp", () => {
  it("usa el ÚLTIMO valor de x-forwarded-for (el hop que el proxy observó)", () => {
    // El cliente pudo poner "1.1.1.1" a la izquierda; el proxy appendea la real a la derecha.
    expect(getClientIp(headers({ "x-forwarded-for": "1.1.1.1, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("no confía en un x-forwarded-for de un solo valor spoofeable si hay más hops", () => {
    expect(getClientIp(headers({ "x-forwarded-for": "9.9.9.9, 8.8.8.8, 203.0.113.9" }))).toBe(
      "203.0.113.9",
    );
  });

  it("prefiere el hop derecho de XFF sobre x-real-ip (XFF lo appendea el proxy)", () => {
    expect(
      getClientIp(headers({ "x-forwarded-for": "1.1.1.1, 203.0.113.9", "x-real-ip": "6.6.6.6" })),
    ).toBe("203.0.113.9");
  });

  it("cae a x-real-ip solo si no hay x-forwarded-for", () => {
    expect(getClientIp(headers({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("fallback local sin headers de proxy", () => {
    expect(getClientIp(headers({}))).toBe("local");
    expect(getClientIp(null)).toBe("local");
    expect(getClientIp(undefined)).toBe("local");
  });

  it("ignora entradas vacías en la cadena", () => {
    expect(getClientIp(headers({ "x-forwarded-for": "1.1.1.1, ," }))).toBe("1.1.1.1");
  });
});
