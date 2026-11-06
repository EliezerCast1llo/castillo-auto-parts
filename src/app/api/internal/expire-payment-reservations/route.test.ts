import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST, isValidBearerToken } from "./route";

const expire = vi.hoisted(() => vi.fn());
const purge = vi.hoisted(() => vi.fn());
vi.mock("@/lib/payment-reservations", () => ({ expirePaymentReservations: expire }));
vi.mock("@/lib/two-factor", () => ({ purgeExpiredTwoFactorChallenges: purge }));
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
    purge.mockResolvedValue(3);
    const response = await handler(new Request("https://shop.test/api/internal/expire-payment-reservations", { headers: { authorization: "Bearer fixture-secret" } }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, purgedTwoFactorChallenges: 3, released: 2 });
    expect(expire).toHaveBeenCalledOnce();
    expect(purge).toHaveBeenCalledOnce();
  });

  it("libera las reservas aunque la purga del segundo factor falle", async () => {
    // La purga viaja de prestado en este cron. Si su excepción se propagara,
    // una tabla sin migrar dejaría las reservas de pago sin expirar, que es lo
    // único que este endpoint existe para hacer.
    vi.stubEnv("RESERVATION_CRON_SECRET", "fixture-secret");
    expire.mockResolvedValue(2);
    purge.mockRejectedValue(new Error("relation does not exist"));

    const response = await POST(new Request("https://shop.test/api/internal/expire-payment-reservations", { headers: { authorization: "Bearer fixture-secret" } }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, purgedTwoFactorChallenges: null, released: 2 });
    expect(expire).toHaveBeenCalledOnce();
  });
});
