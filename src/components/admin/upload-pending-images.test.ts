import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadPendingImages } from "./upload-pending-images";

function image(name: string) {
  return { file: new File([new Uint8Array([1, 2, 3])], name, { type: "image/png" }) };
}

function mockFetch(responses: Array<{ ok: boolean } | Error>) {
  const calls: FormData[] = [];
  const fetchMock = vi.fn(async (_url: string, init: { body: FormData }) => {
    calls.push(init.body);
    const next = responses[calls.length - 1] ?? { ok: true };
    if (next instanceof Error) throw next;
    return next as Response;
  });

  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadPendingImages", () => {
  it("manda el producto recién creado en cada subida", async () => {
    // Es lo único que el navegador no tenía al elegir los archivos, y la ruta
    // de subida lo exige: sin esto no habría a qué colgar la imagen.
    const calls = mockFetch([{ ok: true }, { ok: true }]);

    await uploadPendingImages("prod_123", [image("a.png"), image("b.png")]);

    expect(calls).toHaveLength(2);
    for (const body of calls) {
      expect(body.get("productId")).toBe("prod_123");
    }
  });

  it("marca como principal solo la primera", async () => {
    const calls = mockFetch([{ ok: true }, { ok: true }, { ok: true }]);

    await uploadPendingImages("prod_123", [image("a.png"), image("b.png"), image("c.png")]);

    expect(calls[0].get("isPrimary")).toBe("true");
    expect(calls[1].get("isPrimary")).toBeNull();
    expect(calls[2].get("isPrimary")).toBeNull();
  });

  it("usa el nombre del archivo sin extensión como texto alternativo", async () => {
    const calls = mockFetch([{ ok: true }]);

    await uploadPendingImages("prod_123", [image("pastilla-delantera.png")]);

    expect(calls[0].get("alt")).toBe("pastilla-delantera");
  });

  it("cuenta las que fallan y sigue con las demás", async () => {
    // Cortar en la primera falla dejaría las siguientes sin subir sin que nadie
    // lo sepa; el producto ya existe y lo que importa es cuántas faltan.
    const calls = mockFetch([{ ok: false }, { ok: true }, new Error("red caída")]);

    const failed = await uploadPendingImages("prod_123", [
      image("a.png"),
      image("b.png"),
      image("c.png"),
    ]);

    expect(failed).toBe(2);
    expect(calls).toHaveLength(3);
  });

  it("no llama al servidor si no hay imágenes", async () => {
    const calls = mockFetch([]);

    await expect(uploadPendingImages("prod_123", [])).resolves.toBe(0);
    expect(calls).toHaveLength(0);
  });
});
