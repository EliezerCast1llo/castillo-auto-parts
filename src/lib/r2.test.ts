import { describe, it, expect } from "vitest";
import { buildR2Key, hasValidImageMagicBytes, isValidProductId } from "./r2";

// cuid v1 real (25 chars: c + 24 alfanuméricos)
const VALID_CUID = "cjld2cjxh0000qzrmn831i7rn";

describe("isValidProductId", () => {
  it("acepta un cuid v1 válido", () => {
    expect(isValidProductId(VALID_CUID)).toBe(true);
  });

  it.each(["", "abc", "c123", "../cjld2cjxh0000qzrmn831i7rn", "CJLD2CJXH0000QZRMN831I7RN"])(
    "rechaza '%s'",
    (id) => {
      expect(isValidProductId(id)).toBe(false);
    },
  );

  it("rechaza cadenas con path traversal", () => {
    expect(isValidProductId("../etc/passwd")).toBe(false);
    expect(isValidProductId("../../secret")).toBe(false);
  });
});

describe("buildR2Key", () => {
  it("genera clave con formato products/{id}/{uuid}.{ext}", () => {
    const key = buildR2Key(VALID_CUID, "image/jpeg");
    expect(key).toMatch(
      /^products\/[a-z0-9]{25}\/[0-9a-f-]{36}\.jpg$/,
    );
  });

  it("jpeg y jpg producen extensión jpg", () => {
    expect(buildR2Key(VALID_CUID, "image/jpeg")).toMatch(/\.jpg$/);
    expect(buildR2Key(VALID_CUID, "image/jpg")).toMatch(/\.jpg$/);
  });

  it("png y webp producen su propia extensión", () => {
    expect(buildR2Key(VALID_CUID, "image/png")).toMatch(/\.png$/);
    expect(buildR2Key(VALID_CUID, "image/webp")).toMatch(/\.webp$/);
  });

  it("dos llamadas sucesivas generan claves distintas", () => {
    const a = buildR2Key(VALID_CUID, "image/jpeg");
    const b = buildR2Key(VALID_CUID, "image/jpeg");
    expect(a).not.toBe(b);
  });
});

// Helpers para construir buffers con magic bytes reales
function jpegBuffer(): Buffer {
  const b = Buffer.alloc(16);
  b[0] = 0xff; b[1] = 0xd8; b[2] = 0xff;
  return b;
}

function pngBuffer(): Buffer {
  const b = Buffer.alloc(16);
  b[0] = 0x89; b[1] = 0x50; b[2] = 0x4e; b[3] = 0x47;
  b[4] = 0x0d; b[5] = 0x0a; b[6] = 0x1a; b[7] = 0x0a;
  return b;
}

function webpBuffer(): Buffer {
  const b = Buffer.alloc(16);
  // RIFF
  b[0] = 0x52; b[1] = 0x49; b[2] = 0x46; b[3] = 0x46;
  // file size (bytes 4-7, don't matter)
  // WEBP
  b[8] = 0x57; b[9] = 0x45; b[10] = 0x42; b[11] = 0x50;
  return b;
}

function fakeBuffer(): Buffer {
  return Buffer.from("esto no es una imagen");
}

describe("hasValidImageMagicBytes", () => {
  it("acepta JPEG con magic bytes correctos", () => {
    expect(hasValidImageMagicBytes(jpegBuffer(), "image/jpeg")).toBe(true);
    expect(hasValidImageMagicBytes(jpegBuffer(), "image/jpg")).toBe(true);
  });

  it("acepta PNG con magic bytes correctos", () => {
    expect(hasValidImageMagicBytes(pngBuffer(), "image/png")).toBe(true);
  });

  it("acepta WebP con magic bytes correctos", () => {
    expect(hasValidImageMagicBytes(webpBuffer(), "image/webp")).toBe(true);
  });

  it("rechaza contenido falso con MIME jpeg declarado", () => {
    expect(hasValidImageMagicBytes(fakeBuffer(), "image/jpeg")).toBe(false);
  });

  it("rechaza JPEG real si se declara como PNG", () => {
    expect(hasValidImageMagicBytes(jpegBuffer(), "image/png")).toBe(false);
  });

  it("rechaza buffer demasiado corto", () => {
    expect(hasValidImageMagicBytes(Buffer.alloc(4), "image/webp")).toBe(false);
  });
});
