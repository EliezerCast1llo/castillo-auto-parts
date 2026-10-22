import { describe, expect, it } from "vitest";
import { hasLocalePrefix, isBypassedPath, resolveLegacyRedirect } from "./legacy-redirects";

const BASE = "https://castilloautoparts.com";

function redirectFor(path: string) {
  return resolveLegacyRedirect(new URL(path, BASE))?.toString() ?? null;
}

describe("resolveLegacyRedirect", () => {
  it("prefixes every storefront route family that shipped without a locale", () => {
    expect(redirectFor("/catalog")).toBe(`${BASE}/es/catalog`);
    expect(redirectFor("/cart")).toBe(`${BASE}/es/cart`);
    expect(redirectFor("/checkout")).toBe(`${BASE}/es/checkout`);
    expect(redirectFor("/ayuda")).toBe(`${BASE}/es/ayuda`);
    expect(redirectFor("/design")).toBe(`${BASE}/es/design`);
    expect(redirectFor("/product/filtro-aceite")).toBe(`${BASE}/es/product/filtro-aceite`);
    expect(redirectFor("/vehiculos/toyota")).toBe(`${BASE}/es/vehiculos/toyota`);
    expect(redirectFor("/orders/CAP-20260101-ABC123")).toBe(`${BASE}/es/orders/CAP-20260101-ABC123`);
    expect(redirectFor("/auth/login")).toBe(`${BASE}/es/auth/login`);
    expect(redirectFor("/account/addresses")).toBe(`${BASE}/es/account/addresses`);
    expect(redirectFor("/payments/mock/abc")).toBe(`${BASE}/es/payments/mock/abc`);
  });

  it("preserves the query string and the hash", () => {
    expect(redirectFor("/catalog?stock=LOW_STOCK&brand=Bosch")).toBe(
      `${BASE}/es/catalog?stock=LOW_STOCK&brand=Bosch`,
    );
    expect(redirectFor("/ayuda#envios")).toBe(`${BASE}/es/ayuda#envios`);
    expect(redirectFor("/catalog?q=toyota#resultados")).toBe(
      `${BASE}/es/catalog?q=toyota#resultados`,
    );
  });

  it("leaves the root alone so Accept-Language can be negotiated", () => {
    // Un permanente hacia /es se cachearia por URL sin mirar headers y dejaria
    // clavado en espanol a quien llegue en ingles.
    expect(redirectFor("/")).toBeNull();
  });

  it("never double-prefixes an URL that already carries a locale", () => {
    expect(redirectFor("/es")).toBeNull();
    expect(redirectFor("/en")).toBeNull();
    expect(redirectFor("/es/catalog")).toBeNull();
    expect(redirectFor("/en/catalog")).toBeNull();
  });

  it("does not loop: the redirect target never redirects again", () => {
    const once = resolveLegacyRedirect(new URL("/catalog", BASE));
    expect(once).not.toBeNull();
    expect(resolveLegacyRedirect(once!)).toBeNull();
  });

  it("never touches admin, api or framework paths", () => {
    expect(redirectFor("/admin")).toBeNull();
    expect(redirectFor("/admin/orders")).toBeNull();
    expect(redirectFor("/admin/login?next=%2Fadmin%2Fproducts")).toBeNull();
    expect(redirectFor("/api/search?q=toyota")).toBeNull();
    expect(redirectFor("/_next/static/chunk.js")).toBeNull();
    expect(redirectFor("/.well-known/security.txt")).toBeNull();
  });

  it("ignores anything that looks like a file", () => {
    expect(redirectFor("/robots.txt")).toBeNull();
    expect(redirectFor("/sitemap.xml")).toBeNull();
    expect(redirectFor("/favicon.ico")).toBeNull();
    expect(redirectFor("/logo.png")).toBeNull();
  });

  it("does not treat a prefix lookalike as a locale or a bypass", () => {
    // "/administracion" empieza con "/admin" pero no es el panel, y "/espanol"
    // empieza con "/es" pero no es el prefijo de idioma.
    expect(redirectFor("/administracion")).toBe(`${BASE}/es/administracion`);
    expect(redirectFor("/espanol")).toBe(`${BASE}/es/espanol`);
  });
});

describe("hasLocalePrefix", () => {
  it("matches only exact locale segments", () => {
    expect(hasLocalePrefix("/es")).toBe(true);
    expect(hasLocalePrefix("/en/cart")).toBe(true);
    expect(hasLocalePrefix("/espanol")).toBe(false);
    expect(hasLocalePrefix("/english")).toBe(false);
    expect(hasLocalePrefix("/fr/cart")).toBe(false);
  });
});

describe("isBypassedPath", () => {
  it("matches only exact segments", () => {
    expect(isBypassedPath("/admin")).toBe(true);
    expect(isBypassedPath("/admin/orders")).toBe(true);
    expect(isBypassedPath("/administracion")).toBe(false);
    expect(isBypassedPath("/api/search")).toBe(true);
    expect(isBypassedPath("/apiary")).toBe(false);
  });
});
