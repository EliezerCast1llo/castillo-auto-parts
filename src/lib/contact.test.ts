import { afterEach, describe, expect, it, vi } from "vitest";
import { buildContactLinks, DEFAULT_SUPPORT_WHATSAPP_NUMBER } from "./contact";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe("shared public contact links", () => {
  it("preserves the existing default landing/shipping contact", () => {
    const contact = buildContactLinks(DEFAULT_SUPPORT_WHATSAPP_NUMBER);
    expect(contact.whatsapp).toBe(`https://wa.me/${DEFAULT_SUPPORT_WHATSAPP_NUMBER}`);
    expect(contact.telephone).toBe(`tel:+${DEFAULT_SUPPORT_WHATSAPP_NUMBER}`);
  });
  it("sanitizes the phone and encodes the message exactly once", () => {
    expect(buildContactLinks("+503 7000-1234", "¿Hay envío?\nA&B")).toEqual({
      whatsapp: `https://wa.me/50370001234?text=${encodeURIComponent("¿Hay envío?\nA&B")}`,
      telephone: "tel:+50370001234", displayPhone: "+503 7000 1234",
    });
  });
  it("uses a configured number consistently in landing, checkout and phone links", async () => {
    vi.resetModules(); vi.stubEnv("NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER", "+503 7000 1234");
    const contact = await import("./contact");
    expect(contact.SUPPORT_WHATSAPP_NUMBER).toBe("50370001234");
    expect(contact.buildContactLinks()).toMatchObject({ whatsapp: "https://wa.me/50370001234", telephone: "tel:+50370001234" });
  });
});
