import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteBoxfulLocation, recordBoxfulTopup, saveBoxfulLocation } from "./actions";
const f = vi.hoisted(() => ({ auth: vi.fn(), catalog: vi.fn(), upsert: vi.fn(), remove: vi.fn(), audit: vi.fn(), balance: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/admin-auth", () => ({ requireAdminRole: f.auth }));
vi.mock("@/lib/boxful/config", () => ({ boxfulConfig: () => ({ scope: "account-test" }) }));
vi.mock("@/lib/boxful/provider", () => ({ boxfulCatalog: f.catalog }));
vi.mock("@/lib/db", () => ({ db: { boxfulLocation: { deleteMany: f.remove }, $transaction: (work: (tx: unknown) => unknown) => work({ boxfulLocation: { upsert: f.upsert }, boxfulBalanceEntry: { createMany: f.balance } }) } }));
vi.mock("@/lib/admin-audit", () => ({ writeAdminAuditLog: f.audit }));
vi.mock("next/cache", () => ({ revalidatePath: f.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
function form(data: Record<string, string>) { const f = new FormData(); for (const [k, v] of Object.entries(data)) f.set(k, v); return f; }
beforeEach(() => { vi.clearAllMocks(); f.auth.mockResolvedValue({ role: "ADMIN" }); f.catalog.mockResolvedValue([{ id: "state-sv", name: "San Salvador", Cities: [{ id: "city-sv", name: "San Salvador" }] }]); });
describe("Boxful admin write boundaries", () => {
  it.each([saveBoxfulLocation, deleteBoxfulLocation, recordBoxfulTopup])("requires an authorized role before any provider or DB IO", async (action) => {
    f.auth.mockRejectedValue(new Error("unauthorized"));
    await expect(action(form({}))).rejects.toThrow("unauthorized");
    expect(f.catalog).not.toHaveBeenCalled(); expect(f.upsert).not.toHaveBeenCalled(); expect(f.remove).not.toHaveBeenCalled(); expect(f.balance).not.toHaveBeenCalled();
  });
  it("rejects a city ID outside the selected department's live account catalog", async () => {
    await expect(saveBoxfulLocation(form({ department: "San Salvador", municipality: "San Salvador Centro", stateId: "state-sv", cityId: "attacker-city" }))).rejects.toThrow("redirect:");
    expect(f.upsert).not.toHaveBeenCalled();
  });
  it("stores account-scoped mapping using district name from the API, rather than browser text", async () => {
    await expect(saveBoxfulLocation(form({ department: "San Salvador", municipality: "San Salvador Centro", stateId: "state-sv", cityId: "city-sv", district: "browser supplied fake name" }))).rejects.toThrow("redirect:/admin/boxful?estado=saved");
    expect(f.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ accountScope: "account-test", district: "San Salvador" }) })); expect(f.audit).toHaveBeenCalledOnce();
  });
  it("uses a stable top-up form ID and validates positive integer cents", async () => {
    const id = crypto.randomUUID();
    await expect(recordBoxfulTopup(form({ id, amountCents: "2500" }))).rejects.toThrow("estado=saved");
    expect(f.balance).toHaveBeenCalledWith(expect.objectContaining({ data: { id: `topup:account-test:${id}`, accountScope: "account-test", amountCents: 2500 }, skipDuplicates: true }));
    f.balance.mockClear();
    for (const amountCents of ["0", "-1", "1.5", "NaN"]) await expect(recordBoxfulTopup(form({ id, amountCents }))).rejects.toThrow("estado=invalid");
    expect(f.balance).not.toHaveBeenCalled();
  });
});
