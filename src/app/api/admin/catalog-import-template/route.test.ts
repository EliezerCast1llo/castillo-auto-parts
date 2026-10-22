import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
const auth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin-auth", () => ({ getAdminUserForHandler: auth }));
beforeEach(() => vi.resetAllMocks());
describe("protected CSV template", () => {
  it.each([401, 403])("does not export for a rejected caller (%s)", async (status) => {
    auth.mockResolvedValue({ response: new Response(null, { status }) });
    expect((await GET()).status).toBe(status);
    expect(auth).toHaveBeenCalledWith("ADMIN");
  });
  it("downloads an uncached UTF-8 template for administrators", async () => {
    auth.mockResolvedValue({ user: { role: "ADMIN" } });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(await response.text()).toContain('"sku","nombre","marca"');
  });
});
