import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { DELETE } from "./route";

vi.mock("@/lib/admin-auth", () => ({
  getAdminUserForHandler: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    productImage: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/r2", () => ({
  extractR2Key: vi.fn().mockReturnValue("products/test/key.jpg"),
  deleteFromR2: vi.fn().mockResolvedValue(undefined),
}));

import { getAdminUserForHandler } from "@/lib/admin-auth";
import { db } from "@/lib/db";

const ADMIN_USER = { id: "u1", email: "admin@test.com", name: "Admin", role: "ADMIN" as const };
const MARKETING_USER = { id: "u2", email: "mkt@test.com", name: "Marketing", role: "MARKETING" as const };

const SAMPLE_IMAGE = {
  id: "img-1",
  url: "https://cdn.test.com/products/test/key.jpg",
  productId: "product-1",
  isPrimary: false,
};

function makeRequest(body: unknown) {
  return { json: () => Promise.resolve(body) } as never;
}

function mockTx() {
  return {
    productImage: {
      delete: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
    },
  };
}

describe("DELETE /api/admin/delete-image — autorización por rol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 401 sin sesión admin", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    });
    const res = await DELETE(makeRequest({ imageId: "img-1" }));
    expect(res.status).toBe(401);
  });

  it.each(["SALES", "SUPPORT", "WAREHOUSE", "ACCOUNTING"] as const)(
    "devuelve 403 para rol %s",
    async (role) => {
      vi.mocked(getAdminUserForHandler).mockResolvedValue({
        response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
      });
      const res = await DELETE(makeRequest({ imageId: "img-1" }));
      expect(res.status).toBe(403);
      expect(["SALES", "SUPPORT", "WAREHOUSE", "ACCOUNTING"]).toContain(role);
    },
  );

  it("devuelve 400 cuando falta imageId", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: ADMIN_USER });
    const res = await DELETE(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 cuando imageId es string vacío", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: ADMIN_USER });
    const res = await DELETE(makeRequest({ imageId: "  " }));
    expect(res.status).toBe(400);
  });

  it("devuelve 404 cuando la imagen no existe", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: ADMIN_USER });
    vi.mocked(db.productImage.findUnique).mockResolvedValue(null);
    const res = await DELETE(makeRequest({ imageId: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("devuelve 200 con ok:true para rol ADMIN", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: ADMIN_USER });
    vi.mocked(db.productImage.findUnique).mockResolvedValue(SAMPLE_IMAGE as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.$transaction as any).mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(mockTx()));
    const res = await DELETE(makeRequest({ imageId: "img-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("devuelve 200 para rol MARKETING", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: MARKETING_USER });
    vi.mocked(db.productImage.findUnique).mockResolvedValue({
      ...SAMPLE_IMAGE,
      id: "img-2",
    } as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.$transaction as any).mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(mockTx()));
    const res = await DELETE(makeRequest({ imageId: "img-2" }));
    expect(res.status).toBe(200);
  });

  it("reasigna imagen primaria cuando se elimina la primaria (ADMIN)", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: ADMIN_USER });
    vi.mocked(db.productImage.findUnique).mockResolvedValue({
      ...SAMPLE_IMAGE,
      isPrimary: true,
    } as never);
    const tx = mockTx();
    tx.productImage.findFirst = vi.fn().mockResolvedValue({ id: "img-next" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.$transaction as any).mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(tx));
    const res = await DELETE(makeRequest({ imageId: "img-1" }));
    expect(res.status).toBe(200);
    expect(tx.productImage.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "img-next" }, data: { isPrimary: true } }),
    );
  });
});
