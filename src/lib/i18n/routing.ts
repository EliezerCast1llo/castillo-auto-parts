import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "./config";

/** Cookie con la preferencia de idioma. Sigue la convención `castillo_*`. */
export const LOCALE_COOKIE = "castillo_locale";

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Ruteo de idiomas.
 *
 * `localePrefix: "always"` significa que tanto `/es` como `/en` van prefijados;
 * no existe una versión sin prefijo. Por eso **la URL es la fuente de verdad**
 * del idioma que se renderiza: la cookie es solo una pista que el middleware
 * consulta cuando la URL todavía no trae prefijo (por ejemplo en `/`).
 *
 * Los pathnames localizados (`/es/ayuda` ↔ `/en/help`) se agregan cuando el
 * árbol de rutas se mueva bajo `[locale]`.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  // Negocia con Accept-Language en la primera visita.
  localeDetection: true,
  localeCookie: {
    name: LOCALE_COOKIE,
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    path: "/",
  },
  // Emite el header `Link: <...>; rel="alternate"; hreflang="..."`.
  alternateLinks: true,
});
