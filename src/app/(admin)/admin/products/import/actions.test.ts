import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { confirmCsvImport, previewCsvImport } from "./actions";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), prepare: vi.fn(), commit: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/lib/admin-auth", () => ({ requireAdminRole: mocks.requireAdmin }));
vi.mock("@/lib/catalog-import", () => ({ previewCatalogImport: mocks.prepare, commitCatalogImport: mocks.commit, CatalogImportError: class extends Error {} }));
vi.mock("next/cache", () => ({ updateTag: mocks.updateTag, revalidatePath: vi.fn() }));
vi.mock("@/data/products", () => ({ CATALOG_CACHE_TAG: "catalog", productCacheTag: (slug: string) => `product:${slug}` }));
vi.mock("@/lib/i18n/revalidate", () => ({ revalidateStorefrontPath: vi.fn() }));
const actor = { id: "fixture-admin", role: "ADMIN", email: "fixture@example.com" };
const upload = (contents = "fixture CSV") => { const form = new FormData(); form.set("file", new File([contents], "catalog.csv")); return form; };
const confirmation = (state: Awaited<ReturnType<typeof previewCsvImport>>) => {
  if (state.kind !== "preview" || !state.proof) throw new Error("missing preview");
  const form = new FormData(); form.set("source", state.source); form.set("proof", state.proof); form.set("deactivateDemo", String(state.deactivateDemo)); return form;
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ADMIN_ACCESS_SECRET", "fixture-admin-not-a-real-secret-more-than-32-characters");
  mocks.requireAdmin.mockResolvedValue(actor);
  mocks.prepare.mockResolvedValue({ items: [], errors: [], demo: [], revision: "fixture-revision" });
  mocks.commit.mockResolvedValue({ created: 1, updated: 0, deactivated: 0, slugs: ["fixture-product"] });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("CSV import server actions", () => {
  it("requires ADMIN for both steps before invoking the importer", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("forbidden"));
    await expect(previewCsvImport(upload())).rejects.toThrow("forbidden");
    await expect(confirmCsvImport(new FormData())).rejects.toThrow("forbidden");
    expect(mocks.requireAdmin).toHaveBeenCalledWith("ADMIN");
    expect(mocks.prepare).not.toHaveBeenCalled(); expect(mocks.commit).not.toHaveBeenCalled();
  });
  it("confirms only the reviewed CSV and invalidates catalog and product caches", async () => {
    const state = await previewCsvImport(upload());
    expect(state.kind).toBe("preview"); expect(mocks.commit).not.toHaveBeenCalled();
    const result = await confirmCsvImport(confirmation(state));
    expect(result).toMatchObject({ kind: "success", created: 1 });
    expect(mocks.commit).toHaveBeenCalledWith("fixture CSV", false, "fixture-revision", actor);
    expect(mocks.updateTag).toHaveBeenCalledWith("catalog");
    expect(mocks.updateTag).toHaveBeenCalledWith("product:fixture-product");
  });
  it("rejects altered files, cleanup choices and a different admin at confirmation", async () => {
    const state = await previewCsvImport(upload());
    for (const [key, value] of [["source", "altered"], ["deactivateDemo", "true"]]) {
      const form = confirmation(state); form.set(key, value);
      expect((await confirmCsvImport(form)).kind).toBe("error");
    }
    mocks.requireAdmin.mockResolvedValue({ ...actor, id: "other-admin" });
    expect((await confirmCsvImport(confirmation(state))).kind).toBe("error");
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it("rejects oversized and invalid UTF-8 files before database work", async () => {
    expect((await previewCsvImport(upload("x".repeat(256 * 1024 + 1)))).kind).toBe("error");
    const invalid = new FormData(); invalid.set("file", new File([Uint8Array.from([255])], "invalid.csv"));
    expect((await previewCsvImport(invalid)).kind).toBe("error");
    expect(mocks.prepare).not.toHaveBeenCalled();
  });
  it("cannot confirm a file with row errors", async () => {
    mocks.prepare.mockResolvedValue({ items: [], errors: [{ row: 2, column: "sku", message: "invalid" }], demo: [], revision: "" });
    const state = await previewCsvImport(upload());
    expect(state).toMatchObject({ kind: "preview", proof: null });
    expect((await confirmCsvImport(new FormData())).kind).toBe("error");
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it("reports persisted imports as successful if cache refresh fails", async () => {
    const state = await previewCsvImport(upload()); mocks.updateTag.mockImplementation(() => { throw new Error("cache failure"); });
    expect(await confirmCsvImport(confirmation(state))).toMatchObject({ kind: "success", created: 1, notice: expect.any(String) });
  });
  it("does not expose database errors to the browser", async () => {
    const state = await previewCsvImport(upload()); mocks.commit.mockRejectedValue(new Error("private database credentials"));
    const result = await confirmCsvImport(confirmation(state));
    expect(result.kind).toBe("error"); expect(JSON.stringify(result)).not.toContain("credentials");
  });
});
