import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const query = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { $queryRaw: query } }));
afterEach(() => vi.resetAllMocks());

describe("database readiness", () => {
  it("returns an uncached 200 after reaching PostgreSQL, without query results", async () => {
    query.mockResolvedValue([{ secretRecord: "not-for-the-client" }]);
    const response = await GET();
    expect(query).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("returns 503 without exposing the database failure", async () => {
    query.mockRejectedValue(new Error("connection failed: postgresql://private:secret@db"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ ok: false });
  });
});
