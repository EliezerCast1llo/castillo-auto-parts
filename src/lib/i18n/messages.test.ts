import { describe, expect, it } from "vitest";
import { locales } from "./config";
import en from "./messages/en";
import es from "./messages/es";
import { loadMessages } from "./messages";

/**
 * Claves cuyo texto es legítimamente idéntico en ambos idiomas (nombres de
 * marca, siglas, préstamos que no se traducen). Todo lo demás que salga igual
 * es una traducción olvidada.
 *
 * La lista se escribe a mano a propósito: agregar una clave acá es afirmar que
 * se miró y que la coincidencia es correcta, no que el test molestaba.
 */
const IDENTICAL_BY_DESIGN = new Set<string>([
  // "Subtotal", "Email" y "Total" son la misma palabra en los dos idiomas.
  "Cart.summary.subtotal",
  "Checkout.summary.subtotal",
  "Checkout.form.email",
  "Orders.detail.total",
  // Nombre de la marca: no se traduce en ningún idioma.
  "Account.header.brandEyebrow",
  // "SKU" es la misma sigla en los dos idiomas.
  "Orders.card.sku",
]);

/** Palabras de 3 letras o menos coinciden por casualidad demasiado seguido. */
const MIN_LENGTH_FOR_TRANSLATION_CHECK = 4;

type MessageTree = { [key: string]: string | MessageTree };

function flatten(tree: MessageTree, prefix = ""): Record<string, string> {
  const flat: Record<string, string> = {};

  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      flat[path] = value;
    } else {
      Object.assign(flat, flatten(value, path));
    }
  }

  return flat;
}

const flatEs = flatten(es as MessageTree);
const flatEn = flatten(en as MessageTree);

describe("message catalogs", () => {
  it("covers every configured locale", () => {
    expect(Object.keys({ en, es }).sort()).toEqual([...locales].sort());
  });

  it("is not empty", () => {
    expect(Object.keys(flatEs).length).toBeGreaterThan(0);
  });

  it("has the exact same keys in every locale", () => {
    const esKeys = Object.keys(flatEs).sort();
    const enKeys = Object.keys(flatEn).sort();

    expect(enKeys.filter((key) => !esKeys.includes(key))).toEqual([]);
    expect(esKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
  });

  it("has no empty or whitespace-only values", () => {
    const blank = [...Object.entries(flatEs), ...Object.entries(flatEn)]
      .filter(([, value]) => value.trim().length === 0)
      .map(([key]) => key);

    expect(blank).toEqual([]);
  });

  it("has no English value left identical to the Spanish one", () => {
    const untranslated = Object.entries(flatEs)
      .filter(([key, value]) => {
        if (IDENTICAL_BY_DESIGN.has(key)) return false;
        if (value.length < MIN_LENGTH_FOR_TRANSLATION_CHECK) return false;
        return flatEn[key] === value;
      })
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });
});

describe("loadMessages", () => {
  it("returns the Spanish catalog for es", () => {
    expect(loadMessages("es")).toBe(es);
  });

  it("returns the English catalog for en", () => {
    expect(loadMessages("en")).toBe(en);
  });
});
