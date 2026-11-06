import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guarda contra el error que dejó el proxy sin correr durante meses.
 *
 * Next busca este archivo **al lado de `app/`**. Como `app/` vive en `src/`,
 * un `middleware.ts`/`proxy.ts` en la raíz del repo se ignora **en silencio**:
 * no hay error, no hay aviso, ni siquiera el de deprecación —para avisarlo
 * primero hay que encontrar el archivo—. La app arranca igual y se pierden la
 * CSP, la negociación de idioma (`/` devolvía 404) y el `next` que devuelve al
 * panel a donde iba.
 *
 * Por eso el test mira la **ubicación**, que es lo que falló, y no el
 * contenido: el archivo siempre estuvo bien escrito.
 */
const repoRoot = path.resolve(__dirname, "..");

function appDirectory() {
  for (const candidate of ["src/app", "app"]) {
    if (fs.existsSync(path.join(repoRoot, candidate))) return candidate;
  }

  throw new Error("No se encontró el directorio app/.");
}

describe("ubicación del proxy", () => {
  it("vive en el mismo directorio que app/", () => {
    const appParent = path.dirname(appDirectory());
    const proxyPath = path.join(repoRoot, appParent, "proxy.ts");

    expect(fs.existsSync(proxyPath), `${appParent}/proxy.ts no existe`).toBe(true);
  });

  it("no quedó una copia donde Next no la mira", () => {
    // Una copia en la raíz no rompe nada visible, y por eso es peligrosa:
    // alguien la edita creyendo que es la que corre.
    for (const stray of ["middleware.ts", "proxy.ts", "src/middleware.ts"]) {
      const strayPath = path.join(repoRoot, stray);
      const isTheRealOne = stray === path.join(path.dirname(appDirectory()), "proxy.ts");

      if (isTheRealOne) continue;
      expect(fs.existsSync(strayPath), `${stray} está donde Next no lo lee`).toBe(false);
    }
  });

  it("exporta una función llamada proxy", () => {
    // Next exige el nombre de la convención o un default. Con el nombre viejo
    // el archivo se encuentra pero no se usa.
    const source = fs.readFileSync(
      path.join(repoRoot, path.dirname(appDirectory()), "proxy.ts"),
      "utf8",
    );

    expect(source).toMatch(/export (async )?function proxy\s*\(/);
  });
});
