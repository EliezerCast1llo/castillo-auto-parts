import { describe, expect, it } from "vitest";
import {
  buildCookieConsentSetCookie,
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_VERSION,
  hasAcceptedCurrentConsent,
  parseCookieConsent,
} from "./cookie-consent";

describe("cookie consent", () => {
  it("follows the repo cookie naming convention", () => {
    expect(COOKIE_CONSENT_COOKIE).toBe("castillo_cookie_consent");
  });

  it("writes the current version", () => {
    const [pair] = buildCookieConsentSetCookie().split("; ");

    expect(pair).toBe(`${COOKIE_CONSENT_COOKIE}=${COOKIE_CONSENT_VERSION}`);
    expect(parseCookieConsent(pair.split("=")[1])).toEqual({ version: COOKIE_CONSENT_VERSION });
  });

  it("persists for a year, scoped to the whole site, without blocking JS access", () => {
    const setCookie = buildCookieConsentSetCookie();

    expect(setCookie).toContain("path=/");
    expect(setCookie).toContain(`max-age=${60 * 60 * 24 * 365}`);
    expect(setCookie).toContain("samesite=lax");
    // El cliente tiene que poder escribirla sin ida y vuelta al servidor.
    expect(setCookie.toLowerCase()).not.toContain("httponly");
  });

  it("treats a missing or malformed cookie as not accepted", () => {
    expect(parseCookieConsent(undefined)).toBeNull();
    expect(parseCookieConsent("")).toBeNull();
    expect(parseCookieConsent("   ")).toBeNull();
  });

  it("re-prompts when the stored version is not the current one", () => {
    // Bumpear la version es como se vuelve a preguntar tras cambiar la politica.
    expect(hasAcceptedCurrentConsent({ version: COOKIE_CONSENT_VERSION })).toBe(true);
    expect(hasAcceptedCurrentConsent({ version: "v0" })).toBe(false);
    expect(hasAcceptedCurrentConsent(null)).toBe(false);
  });

});
