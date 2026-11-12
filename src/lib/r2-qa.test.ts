import { afterEach, beforeEach, expect, it, vi } from "vitest";
const send = vi.hoisted(() => vi.fn());
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { send = send; },
  PutObjectCommand: class { constructor(readonly input: unknown) {} },
  DeleteObjectCommand: class { constructor(readonly input: unknown) {} },
}));
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
beforeEach(() => {
  vi.stubEnv("CLOUDFLARE_R2_ACCOUNT_ID", "qa-fixture");
  vi.stubEnv("CLOUDFLARE_R2_ACCESS_KEY_ID", "fixture");
  vi.stubEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY", "fixture");
  vi.stubEnv("CLOUDFLARE_R2_BUCKET_NAME", "qa-bucket");
  vi.stubEnv("CLOUDFLARE_R2_PUBLIC_URL", "https://qa-images.example.com");
  send.mockReset(); send.mockResolvedValue({});
});
it("uploads and deletes using the local SDK mock without contacting R2", async () => {
  const body = Buffer.from("image fixture");
  expect(await uploadToR2("products/qa/image.png", body, "image/png")).toMatchObject({ publicUrl: "https://qa-images.example.com/products/qa/image.png" });
  expect(send.mock.calls[0][0].input).toMatchObject({ Bucket: "qa-bucket", Key: "products/qa/image.png", Body: body, ContentType: "image/png" });
  await deleteFromR2("products/qa/image.png");
  expect(send.mock.calls[1][0].input).toEqual({ Bucket: "qa-bucket", Key: "products/qa/image.png" });
});

afterEach(() => { vi.unstubAllEnvs(); });
