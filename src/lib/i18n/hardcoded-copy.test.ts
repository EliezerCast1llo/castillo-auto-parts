import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guarda contra texto de interfaz escrito a mano en el storefront.
 *
 * Existe por un error concreto: los barridos anteriores buscaban **acentos**,
 * así que "Marca", "Modelo" y "Selecciona marca" pasaron inadvertidos y el
 * selector de vehículo del hero quedó a medio traducir mientras la PR afirmaba
 * que no quedaba nada. Un detector que solo ve tildes no sirve para un idioma
 * cuyas palabras más comunes no las llevan.
 *
 * Este mira **atributos de interfaz** —los que siempre llevan copy— en vez de
 * adivinar por caracteres. Es más angosto y más confiable: no detecta texto
 * suelto en JSX, pero lo que promete lo cumple.
 */
const UI_ATTRIBUTES = /(?:aria-label|placeholder|title|label|legend|alt|actionLabel)="([^"]{3,})"/g;

/**
 * Archivos que no se traducen, con su motivo. Cada uno está documentado en su
 * propio encabezado; acá se repite el porqué para que agregar una entrada sea
 * una decisión y no un atajo para silenciar el test.
 */
const EXCLUDED = [
  // 404 en producción y fuera del sitemap: su lector es quien desarrolla.
  "app/(storefront)/[locale]/design/page.tsx",
  // Guardado por configuración de proveedor; se autodescribe como entorno de desarrollo.
  "app/(storefront)/[locale]/payments/mock/[externalPaymentId]/page.tsx",
  // Código muerto: ningún import lo referencia. Traducirlo lo haría parecer vivo.
  "components/account/add-address-form.tsx",
];

/** Un valor que parece copy y no un identificador, clase CSS o slug. */
function looksLikeCopy(value: string) {
  if (/^[a-z][a-zA-Z0-9-]*$/.test(value)) return false;
  if (/^[A-Z_]+$/.test(value)) return false;
  if (/[{}<>#]|^\d+$/.test(value)) return false;

  return /^[A-ZÁÉÍÓÚ¿¡]/.test(value);
}

function collectFiles(dir: string): string[] {
  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (/node_modules|\.test\.|\/admin/.test(full)) continue;
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (/\.tsx?$/.test(full)) out.push(full);
  }

  return out;
}

describe("copy sin traducir", () => {
  it("ningún atributo de interfaz del storefront lleva texto escrito a mano", () => {
    const roots = ["src/app/(storefront)", "src/components"];
    const files = roots.flatMap(collectFiles);
    const excluded = new Set(EXCLUDED.map((f) => path.join("src", f)));

    const findings = files
      .filter((file) => !excluded.has(file))
      .flatMap((file) => {
        const source = fs.readFileSync(file, "utf8");

        return [...source.matchAll(UI_ATTRIBUTES)]
          .map((match) => match[1]!)
          .filter(looksLikeCopy)
          .map((value) => `${file}: ${JSON.stringify(value)}`);
      });

    expect(findings).toEqual([]);
  });

  it("cada archivo excluido existe", () => {
    // Una exclusión que apunta a un archivo borrado deja de proteger nada y
    // pasa a esconder lo que venga después con ese nombre.
    for (const file of EXCLUDED) {
      expect(fs.existsSync(path.join("src", file)), `${file} ya no existe`).toBe(true);
    }
  });
});
