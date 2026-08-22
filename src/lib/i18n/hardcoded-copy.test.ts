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
 *
 * Cubre las tres formas en que el copy llega a un atributo, y las tres están
 * verificadas en rojo abajo:
 *
 * 1. `label="Marca"` — plana.
 * 2. `placeholder={cond ? "Uno" : "Otro"}` — dentro de una expresión. Dos de
 *    las seis cadenas del bug que originó este test tenían esta forma, así que
 *    un detector que solo viera la primera habría dejado pasar justo lo que
 *    motivó su existencia.
 * 3. ``label={`Productos de ${x}`}`` — template literal.
 */
const UI_ATTRIBUTES = /(?:aria-label|placeholder|title|label|legend|alt|actionLabel)=/g;

/** Literales de texto: comillas dobles o backticks. */
const STRING_LITERALS = /"([^"]{3,})"|`([^`]{3,})`/g;

/**
 * Extrae los valores de los atributos de interfaz de un archivo.
 *
 * Se hace en dos pasos y no con un solo regex a propósito. Con uno solo, de
 * `{direction === "left" ? "Anterior" : "Siguiente"}` se captura únicamente el
 * primer literal —`"left"`, que no es copy— y las dos cadenas visibles pasan
 * limpias. Ese fue el hueco real: dos de las seis cadenas del bug que originó
 * este test tenían exactamente esa forma.
 *
 * Ahora se delimita el valor del atributo (plano o entre llaves, respetando
 * anidamiento) y después se leen **todos** los literales que haya adentro.
 */
function extractAttributeCopy(source: string): string[] {
  const values: string[] = [];

  for (const match of source.matchAll(UI_ATTRIBUTES)) {
    const start = match.index! + match[0].length;
    const char = source[start];

    if (char === '"') {
      const end = source.indexOf('"', start + 1);
      if (end > start) values.push(source.slice(start + 1, end));
      continue;
    }

    if (char !== "{") continue;

    // Recorre hasta cerrar la llave, contando anidamiento: un ternario puede
    // contener objetos o template literals con sus propias llaves.
    let depth = 0;
    let end = start;
    for (; end < source.length; end += 1) {
      if (source[end] === "{") depth += 1;
      else if (source[end] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }

    const expression = source.slice(start, end + 1);
    for (const literal of expression.matchAll(STRING_LITERALS)) {
      values.push(literal[1] ?? literal[2]!);
    }
  }

  return values;
}

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

/**
 * Un valor que parece copy y no un identificador, clase CSS o slug.
 *
 * La mayúscula inicial no alcanza como criterio: "cantidad de unidades" es copy
 * y empieza en minúscula. Un espacio interior lo delata, porque los
 * identificadores no los llevan.
 */
function looksLikeCopy(raw: string) {
  // Las interpolaciones de un template se vacían antes de juzgar: lo que se
  // evalúa es el texto fijo, no el nombre de la variable que se inserta.
  const value = raw.replace(/\$\{[^}]*\}/g, "").trim();

  if (value.length < 3) return false;
  if (/^[a-z][a-zA-Z0-9-]*$/.test(value)) return false;
  if (/^[A-Z_]+$/.test(value)) return false;
  if (/[<>#]|^\d+$/.test(value)) return false;

  // Listas de clases de Tailwind: varias palabras en minúscula donde al menos
  // una trae guion, dos puntos, barra o corchete. Ese detalle es lo que las
  // separa de una frase en minúscula como "cantidad de unidades", que sí es
  // copy y antes quedaba excluida junto con ellas.
  const tokens = value.split(/\s+/);
  const looksLikeClassList =
    tokens.length > 1 &&
    tokens.every((token) => /^[a-z0-9:\/\[\]().,%_-]+$/.test(token)) &&
    tokens.some((token) => /[-:\/\[]/.test(token));
  if (looksLikeClassList) return false;

  return /^[A-ZÁÉÍÓÚ¿¡]/.test(value) || /\s/.test(value);
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

        return extractAttributeCopy(source)
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
