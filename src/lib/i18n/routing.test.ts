import { describe, expect, it } from "vitest";
import { defaultLocale, locales } from "./config";
import { toIntlLocale, APP_CURRENCY, APP_TIME_ZONE } from "./intl-locale";
import { LOCALIZE_PATH_ROUTES } from "./path";
import { LOCALE_COOKIE, pathnames, routing } from "./routing";

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

describe("localized pathnames", () => {
  it("declares every locale for the routes whose spelling changes", () => {
    for (const [key, value] of Object.entries(pathnames)) {
      if (typeof value === "string") continue;

      for (const locale of locales) {
        expect(value[locale], `${key} is missing the ${locale} spelling`).toBeTruthy();
      }
    }
  });

  it("keeps the dynamic segments in every spelling", () => {
    for (const [key, value] of Object.entries(pathnames)) {
      const segments = key.match(/\[[^\]]+\]/g) ?? [];
      if (segments.length === 0) continue;

      const spellings = typeof value === "string" ? [value] : Object.values(value);
      for (const spelling of spellings) {
        for (const segment of segments) {
          expect(spelling, `${key} lost ${segment} in "${spelling}"`).toContain(segment);
        }
      }
    }
  });

  it("does not produce two routes with the same public URL in one locale", () => {
    for (const locale of locales) {
      const urls = Object.values(pathnames).map((value) =>
        typeof value === "string" ? value : value[locale],
      );

      expect(new Set(urls).size, `duplicate public URL in ${locale}`).toBe(urls.length);
    }
  });

  it("localizes the two routes that shipped with Spanish names", () => {
    expect(pathnames["/help"]).toEqual({ es: "/ayuda", en: "/help" });
    expect(pathnames["/vehicles/[make]"]).toEqual({
      es: "/vehiculos/[make]",
      en: "/vehicles/[make]",
    });
  });
});

describe("localizePath constraint", () => {
  it("keeps the routes that localizePath handles identical in every language", () => {
    // `localizePath` solo antepone el prefijo: no consulta la tabla. Si alguna
    // de estas rutas se localiza, el JSON-LD y la URL de retorno del pago
    // empezarian a emitir la grafia equivocada sin que nada falle.
    for (const route of LOCALIZE_PATH_ROUTES) {
      expect(typeof pathnames[route], `${route} está localizada`).toBe("string");
    }
  });

  it("covers a route that localizePath must not be used for", () => {
    // Contraprueba: /help sí cambia de grafía, así que no puede pasar por el
    // helper. Si esto deja de ser cierto, el test de arriba pierde sentido.
    expect(typeof pathnames["/help"]).not.toBe("string");
  });
});
