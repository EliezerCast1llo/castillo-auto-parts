import { describe, expect, it } from "vitest";
import {
  buildCookieConsentClearCookie,
  buildCookieConsentSetCookie,
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_VERSION,
  hasAcceptedCurrentConsent,
  parseCookieConsent,
  readCookieConsentFromDocument,
} from "./cookie-consent";

describe("cookie consent", () => {
  it("follows the repo cookie naming convention", () => {
    expect(COOKIE_CONSENT_COOKIE).toBe("castillo_cookie_consent");
  });

  it("round-trips the accepted version through document.cookie", () => {
    const setCookie = buildCookieConsentSetCookie();
    const [pair] = setCookie.split("; ");

    expect(readCookieConsentFromDocument(pair)).toEqual({ version: COOKIE_CONSENT_VERSION });
  });

  it("persists for a year, scoped to the whole site, without blocking JS access", () => {
    const setCookie = buildCookieConsentSetCookie();

    expect(setCookie).toContain("path=/");
    expect(setCookie).toContain(`max-age=${60 * 60 * 24 * 365}`);
    expect(setCookie).toContain("samesite=lax");
    // El cliente tiene que poder escribirla sin ida y vuelta al servidor.
    expect(setCookie.toLowerCase()).not.toContain("httponly");
  });

  it("expires the cookie when cleared", () => {
    expect(buildCookieConsentClearCookie()).toContain("max-age=0");
  });

  it("treats a missing or malformed cookie as not accepted", () => {
    expect(parseCookieConsent(undefined)).toBeNull();
    expect(parseCookieConsent("")).toBeNull();
    expect(parseCookieConsent("   ")).toBeNull();
    expect(readCookieConsentFromDocument("otra=cosa")).toBeNull();
  });

  it("re-prompts when the stored version is not the current one", () => {
    // Bumpear la version es como se vuelve a preguntar tras cambiar la politica.
    expect(hasAcceptedCurrentConsent({ version: COOKIE_CONSENT_VERSION })).toBe(true);
    expect(hasAcceptedCurrentConsent({ version: "v0" })).toBe(false);
    expect(hasAcceptedCurrentConsent(null)).toBe(false);
  });

  it("ignores other cookies that share the prefix", () => {
    const source = `castillo_locale=en; ${COOKIE_CONSENT_COOKIE}=${COOKIE_CONSENT_VERSION}; castillo_my_vehicle=x`;

    expect(readCookieConsentFromDocument(source)).toEqual({ version: COOKIE_CONSENT_VERSION });
  });
});
