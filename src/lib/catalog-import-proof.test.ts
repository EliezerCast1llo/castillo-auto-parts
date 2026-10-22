import { describe, expect, it } from "vitest";
import { IMPORT_PREVIEW_TTL_MS, signImportPreview, verifyImportPreview } from "./catalog-import-proof";

const secret = "fixture-preview-not-a-real-secret-over-32-characters";
const input = { source: "sku,nombre\nONE,Producto", adminId: "admin-one", deactivateDemo: false, revision: "revision-one" };

describe("confirmed CSV preview", () => {
  it("accepts only the reviewed input and admin before expiry", () => {
    const proof = signImportPreview(input, secret, 1000);
    expect(verifyImportPreview({ ...input, proof }, secret, 2000)).toBe(input.revision);
    expect(verifyImportPreview({ ...input, proof }, secret, 1000 + IMPORT_PREVIEW_TTL_MS)).toBeNull();
    for (const change of [{ source: "different CSV" }, { adminId: "admin-two" }, { deactivateDemo: true }]) {
      expect(verifyImportPreview({ ...input, proof, ...change }, secret, 2000)).toBeNull();
    }
    expect(verifyImportPreview({ ...input, proof }, `${secret}-rotated`, 2000)).toBeNull();
  });
  it("rejects tampered, malformed or unsigned previews", () => {
    const proof = signImportPreview(input, secret, 1000);
    for (const invalid of ["", "not-a-proof", proof + ".extra", "x" + proof, "a".repeat(3000)]) {
      expect(verifyImportPreview({ ...input, proof: invalid }, secret, 2000)).toBeNull();
    }
    expect(() => signImportPreview(input, "short")).toThrow("ADMIN_ACCESS_SECRET");
  });
});
