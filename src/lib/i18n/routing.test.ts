import { describe, expect, it } from "vitest";
import { defaultLocale, locales } from "./config";
import { toIntlLocale, APP_CURRENCY, APP_TIME_ZONE } from "./intl-locale";
import { LOCALE_COOKIE, routing } from "./routing";

describe("routing", () => {
  it("exposes both locales with Spanish as the default", () => {
    expect(routing.locales).toEqual(locales);
    expect(routing.defaultLocale).toBe(defaultLocale);
    expect(defaultLocale).toBe("es");
  });

  it("prefixes every locale so the URL is the source of truth", () => {
    expect(routing.localePrefix).toBe("always");
  });

  it("negotiates Accept-Language for first-time visitors", () => {
    expect(routing.localeDetection).toBe(true);
  });

  it("names the locale cookie after the repo convention", () => {
    expect(LOCALE_COOKIE).toBe("castillo_locale");
    expect(LOCALE_COOKIE.startsWith("castillo_")).toBe(true);
    expect(routing.localeCookie).toMatchObject({
      name: LOCALE_COOKIE,
      sameSite: "lax",
      path: "/",
    });
  });

  it("marks the locale cookie Secure in production like every other cookie", () => {
    // next-intl hace merge con sus defaults, pero esos defaults son solo `name`
    // y `sameSite`: si no se declara acá, la cookie viaja sin Secure.
    expect(routing.localeCookie).toHaveProperty("secure");
    expect((routing.localeCookie as { secure: boolean }).secure).toBe(
      process.env.NODE_ENV === "production",
    );
  });

  it("emits alternate links so search engines find the other language", () => {
    expect(routing.alternateLinks).toBe(true);
  });
});

describe("intl locale", () => {
  it("maps every app locale to a BCP-47 tag", () => {
    expect(toIntlLocale("es")).toBe("es-SV");
    expect(toIntlLocale("en")).toBe("en-US");
    expect(locales.every((locale) => toIntlLocale(locale).includes("-"))).toBe(true);
  });

  it("keeps currency and time zone independent of the language", () => {
    // El Salvador está dolarizado y el negocio opera en su zona horaria: el
    // idioma cambia el formato, no la moneda ni la hora.
    expect(APP_CURRENCY).toBe("USD");
    expect(APP_TIME_ZONE).toBe("America/El_Salvador");
  });
});
