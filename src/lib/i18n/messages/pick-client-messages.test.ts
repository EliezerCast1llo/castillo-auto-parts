import { describe, expect, it } from "vitest";
import en from "./en";
import es from "./es";
import { pickClientMessages } from "./index";

describe("pickClientMessages", () => {
  it("ships only the namespaces the client components use", () => {
    // Todo lo que salga de acá viaja al navegador en cada página del
    // storefront, así que la lista es deliberadamente corta.
    expect(Object.keys(pickClientMessages(es)).sort()).toEqual([
      "Account",
      "Auth",
      "Cart",
      "Checkout",
      "Common",
      "Consent",
      "Errors",
      "Nav",
      "VehicleSearch",
    ]);
  });

  it("keeps the status messages out of the browser", () => {
    // Los códigos de `?estado=` se traducen en el servidor y bajan como texto.
    // Si `Status` entrara acá, los mensajes de auth, cuenta, carrito y checkout
    // viajarían en cada página del storefront para usarse en cuatro.
    expect(pickClientMessages(es)).not.toHaveProperty("Status");
  });

  it("never ships the whole catalog", () => {
    const picked = Object.keys(pickClientMessages(es));

    expect(picked.length).toBeLessThan(Object.keys(es).length + 1);
    for (const namespace of picked) {
      expect(es).toHaveProperty(namespace);
    }
  });

  it("carries the real messages, not empty placeholders", () => {
    const picked = pickClientMessages(es);

    expect(picked.Consent).toEqual(es.Consent);
    expect(picked.Common).toEqual(es.Common);
  });

  it("picks the same namespaces in every language", () => {
    expect(Object.keys(pickClientMessages(en))).toEqual(Object.keys(pickClientMessages(es)));
  });
});
