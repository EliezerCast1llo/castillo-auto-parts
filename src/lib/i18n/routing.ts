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
 * `pathnames` mapea la ruta interna a su grafía pública por idioma. **La clave
 * es el nombre del directorio**, no la URL: por eso `/help` y `/vehicles` se
 * llaman así en disco aunque en español se sirvan como `/ayuda` y `/vehiculos`.
 * El resto de las rutas ya estaban en inglés, así que se sirven igual en ambos.
 */
export const pathnames = {
  "/": "/",
  "/catalog": "/catalog",
  "/cart": "/cart",
  "/checkout": "/checkout",
  "/design": "/design",
  "/product/[slug]": "/product/[slug]",
  "/orders/[orderNumber]": "/orders/[orderNumber]",
  "/payments/mock/[externalPaymentId]": "/payments/mock/[externalPaymentId]",
  "/auth/login": "/auth/login",
  "/auth/register": "/auth/register",
  "/auth/forgot-password": "/auth/forgot-password",
  "/auth/reset-password/[token]": "/auth/reset-password/[token]",
  "/account": "/account",
  "/account/orders": "/account/orders",
  "/account/addresses": "/account/addresses",

  // Las dos únicas rutas que ya venían con nombre en español.
  "/help": {
    es: "/ayuda",
    en: "/help",
  },
  "/vehicles/[make]": {
    es: "/vehiculos/[make]",
    en: "/vehicles/[make]",
  },
} as const;

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
    // next-intl hace merge con sus defaults, pero esos defaults son solo `name`
    // y `sameSite`: nunca escribe `secure`. Sin esto sería la única cookie del
    // repo que viaja sin Secure en producción.
    secure: process.env.NODE_ENV === "production",
  },
  // Emite el header `Link: <...>; rel="alternate"; hreflang="..."`.
  alternateLinks: true,
  pathnames,
});
