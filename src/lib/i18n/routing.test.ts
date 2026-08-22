import { describe, expect, it } from "vitest";
import { defaultLocale, isPublishedLocale, locales, publishedLocales } from "./config";
import { toIntlLocale, APP_CURRENCY, APP_TIME_ZONE } from "./intl-locale";
import { LOCALIZE_PATH_ROUTES } from "./path";
import { LOCALE_COOKIE, pathnames, routing } from "./routing";
import { loadMessages } from "./messages";

type MessageTree = { [key: string]: string | MessageTree };

/** Aplana el catálogo a claves con punto, igual que en messages.test.ts. */
function flatten(tree: MessageTree, prefix = ""): Record<string, string> {
  const flat: Record<string, string> = {};

  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") flat[path] = value;
    else Object.assign(flat, flatten(value, path));
  }

  return flat;
}

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

describe("published locales", () => {
  it("always publishes the default language", () => {
    expect(publishedLocales).toContain(defaultLocale);
    expect(isPublishedLocale(defaultLocale)).toBe(true);
  });

  it("only lists languages that exist", () => {
    for (const locale of publishedLocales) {
      expect(locales).toContain(locale);
    }
  });

  it("solo publica idiomas cuyo catálogo está completo", () => {
    // Reemplaza al cable trampa que exigía que "en" no estuviera publicado.
    // Ese test cumplió su función —se cayó al accionar el interruptor, que era
    // el momento de revisar el catálogo— pero afirmaba una fecha, no una regla.
    //
    // La regla es esta: publicar un idioma exige que tenga todas las claves del
    // idioma por defecto. Sirve igual para el tercer idioma que venga.
    const esperadas = Object.keys(flatten(loadMessages(defaultLocale) as MessageTree));

    for (const locale of publishedLocales) {
      const suyas = new Set(Object.keys(flatten(loadMessages(locale) as MessageTree)));
      const faltan = esperadas.filter((key) => !suyas.has(key));

      expect(faltan, `${locale} publicado con claves sin traducir`).toEqual([]);
    }
  });

  it("publica los dos idiomas del sitio", () => {
    expect(isPublishedLocale("es")).toBe(true);
    expect(isPublishedLocale("en")).toBe(true);
  });
});
