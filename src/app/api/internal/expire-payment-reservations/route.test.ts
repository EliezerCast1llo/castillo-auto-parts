import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST, isValidBearerToken } from "./route";

const expire = vi.hoisted(() => vi.fn());
vi.mock("@/lib/payment-reservations", () => ({ expirePaymentReservations: expire }));
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

describe("reservation expiration authorization", () => {
  it("accepts only an exact bearer secret", () => {
    expect(isValidBearerToken("Bearer cron-secret", "cron-secret")).toBe(true);
    expect(isValidBearerToken("Bearer wrong-secret", "cron-secret")).toBe(false);
    expect(isValidBearerToken("cron-secret", "cron-secret")).toBe(false);
    expect(isValidBearerToken(null, "cron-secret")).toBe(false);
  });

  it("fails closed when the scheduler secret is missing", async () => {
    vi.stubEnv("RESERVATION_CRON_SECRET", "");
    const response = await POST(new Request("https://shop.test/api/internal/expire-payment-reservations"));
    expect(response.status).toBe(503);
    expect(expire).not.toHaveBeenCalled();
  });

  it("rejects an invalid caller before touching reservations", async () => {
    vi.stubEnv("RESERVATION_CRON_SECRET", "fixture-secret");
    const response = await POST(new Request("https://shop.test/api/internal/expire-payment-reservations", { headers: { authorization: "Bearer invalid" } }));
    expect(response.status).toBe(401);
    expect(expire).not.toHaveBeenCalled();
  });

  it.each([GET, POST])("runs expiration for an authenticated scheduler", async (handler) => {
    vi.stubEnv("RESERVATION_CRON_SECRET", "fixture-secret");
    expire.mockResolvedValue(2);
    const response = await handler(new Request("https://shop.test/api/internal/expire-payment-reservations", { headers: { authorization: "Bearer fixture-secret" } }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, released: 2 });
    expect(expire).toHaveBeenCalledOnce();
  });
});
