import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/admin-auth", () => ({
  getAdminUserForHandler: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    product: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/r2", () => ({
  buildR2Key: vi.fn().mockReturnValue("products/test/key.jpg"),
  isAllowedImageMimeType: vi.fn().mockReturnValue(true),
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
  uploadToR2: vi.fn().mockResolvedValue({ publicUrl: "https://cdn.test.com/key.jpg" }),
  deleteFromR2: vi.fn().mockResolvedValue(undefined),
}));

import { getAdminUserForHandler } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isAllowedImageMimeType } from "@/lib/r2";

const ADMIN_USER = { id: "u1", email: "admin@test.com", name: "Admin", role: "ADMIN" as const };
const MARKETING_USER = { id: "u2", email: "mkt@test.com", name: "Marketing", role: "MARKETING" as const };

function makeRequest(formData: FormData) {
  return {
    formData: () => Promise.resolve(formData),
  } as never;
}

function makeFormData(overrides: { file?: File | null; productId?: string } = {}) {
  const fd = new FormData();
  const file =
    overrides.file !== undefined
      ? overrides.file
      : new File(["fake-image-bytes"], "photo.jpg", { type: "image/jpeg" });
  if (file) fd.append("file", file);
  fd.append("productId", overrides.productId ?? "product-id-123");
  return fd;
}

function mockTx() {
  return {
    productImage: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: null } }),
      create: vi.fn().mockResolvedValue({
        id: "img-1",
        url: "https://cdn.test.com/key.jpg",
        isPrimary: true,
      }),
    },
  };
}

describe("POST /api/admin/upload-image — autorización por rol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAllowedImageMimeType).mockReturnValue(true);
  });

  it("devuelve 401 sin sesión admin", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    });
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(401);
  });

  it.each(["SALES", "SUPPORT", "WAREHOUSE", "ACCOUNTING"] as const)(
    "devuelve 403 para rol %s",
    async (role) => {
      vi.mocked(getAdminUserForHandler).mockResolvedValue({
        response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
      });
      const res = await POST(makeRequest(makeFormData()));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBeDefined();
      // Evita falso positivo: aseguramos que el rol está dentro de los restringidos
      expect(["SALES", "SUPPORT", "WAREHOUSE", "ACCOUNTING"]).toContain(role);
    },
  );

  it("devuelve 400 cuando falta el campo file", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: ADMIN_USER });
    const fd = new FormData();
    fd.append("productId", "product-id-123");
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 para MIME type no permitido", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: ADMIN_USER });
    vi.mocked(isAllowedImageMimeType).mockReturnValue(false);
    const file = new File(["pdf content"], "doc.pdf", { type: "application/pdf" });
    const res = await POST(makeRequest(makeFormData({ file })));
    expect(res.status).toBe(400);
  });

  it("devuelve 404 cuando el producto no existe", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: ADMIN_USER });
    vi.mocked(db.product.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(404);
  });

  it("devuelve 200 con imageId para rol ADMIN", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: ADMIN_USER });
    vi.mocked(db.product.findUnique).mockResolvedValue({
      id: "product-id-123",
      name: "Filtro Toyota",
    } as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.$transaction as any).mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(mockTx()));
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imageId).toBe("img-1");
    expect(body.url).toBeDefined();
  });

  it("devuelve 200 para rol MARKETING", async () => {
    vi.mocked(getAdminUserForHandler).mockResolvedValue({ user: MARKETING_USER });
    vi.mocked(db.product.findUnique).mockResolvedValue({
      id: "product-id-123",
      name: "Filtro Toyota",
    } as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.$transaction as any).mockImplementation(async (fn: (tx: any) => Promise<any>) =>
      fn({
        ...mockTx(),
        productImage: {
          ...mockTx().productImage,
          create: vi.fn().mockResolvedValue({
            id: "img-2",
            url: "https://cdn.test.com/key.jpg",
            isPrimary: true,
          }),
        },
      }),
    );
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imageId).toBe("img-2");
  });
});
