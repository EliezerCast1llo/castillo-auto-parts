/**
 * Consentimiento de cookies.
 *
 * El aviso es informativo: el sitio solo usa cookies necesarias (sesión,
 * carrito, idioma, clave de reintento del checkout). No hay analítica ni
 * publicidad, así que aceptar no habilita nada — solo deja de mostrar el aviso.
 *
 * La cookie es deliberadamente NO httpOnly: la escribe el cliente al aceptar,
 * sin round-trip al servidor, y la lee el servidor para decidir si renderiza el
 * banner. No es una frontera de seguridad, así que tampoco va firmada.
 *
 * Helpers puros e isomorfos; la lectura server-side vive en
 * `cookie-consent-server.ts`. Mismo patrón que `my-vehicle.ts`.
 */

export const COOKIE_CONSENT_COOKIE = "castillo_cookie_consent";

/** Se bumpea para volver a preguntar tras un cambio de política. */
export const COOKIE_CONSENT_VERSION = "v1";

const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type CookieConsent = {
  version: string;
};

export function parseCookieConsent(value: string | undefined): CookieConsent | null {
  if (!value) return null;

  const version = decodeURIComponent(value).trim();
  if (!version) return null;

  return { version };
}

/**
 * Solo cuenta como aceptado el consentimiento de la versión vigente: si la
 * política cambia, la versión se bumpea y el aviso vuelve a aparecer.
 */
export function hasAcceptedCurrentConsent(consent: CookieConsent | null): boolean {
  return consent?.version === COOKIE_CONSENT_VERSION;
}

export function buildCookieConsentSetCookie() {
  return `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(COOKIE_CONSENT_VERSION)}; path=/; max-age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; samesite=lax`;
}

export function buildCookieConsentClearCookie() {
  return `${COOKIE_CONSENT_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** Lee la cookie desde document.cookie (solo cliente). */
export function readCookieConsentFromDocument(cookieSource: string): CookieConsent | null {
  const entry = cookieSource
    .split("; ")
    .find((item) => item.startsWith(`${COOKIE_CONSENT_COOKIE}=`));

  return parseCookieConsent(entry?.slice(COOKIE_CONSENT_COOKIE.length + 1));
}
