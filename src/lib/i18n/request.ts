import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";
import { formats } from "./formats";
import { APP_TIME_ZONE } from "./intl-locale";
import { loadMessages } from "./messages";
import { LOCALE_COOKIE } from "./routing";

/**
 * Configuración por request que consume next-intl.
 *
 * El orden de resolución importa:
 *
 * 1. `locale` explícito — lo que se pasa en `getTranslations({ locale })`. Es la
 *    única forma de traducir fuera de un request con segmento de idioma, que es
 *    exactamente el caso del webhook de pagos cuando manda el email de
 *    confirmación.
 * 2. `requestLocale` — el segmento `[locale]` que matcheó el middleware. Está
 *    marcado `@deprecated` a favor de `next/root-params`, pero root-params
 *    sigue detrás del flag `experimental.rootParams`, así que no es migrable
 *    hasta que se estabilice.
 * 3. La cookie de idioma — red de seguridad para server actions, route handlers
 *    y cualquier render fuera de `[locale]`, donde `requestLocale` viene
 *    `undefined`. Sin esto, esos caminos caerían siempre a español en vez de
 *    respetar la elección del usuario.
 * 4. `defaultLocale`.
 */
export default getRequestConfig(async ({ locale: explicitLocale, requestLocale }) => {
  const locale = await resolveLocale(explicitLocale, requestLocale);

  return {
    locale,
    messages: loadMessages(locale),
    // El negocio está en El Salvador. Sin esto next-intl advierte y cae a la
    // zona horaria del servidor, que en producción es UTC.
    timeZone: APP_TIME_ZONE,
    formats,
  };
});

async function resolveLocale(
  explicitLocale: string | undefined,
  requestLocale: Promise<string | undefined>,
): Promise<Locale> {
  if (hasLocale(locales, explicitLocale)) return explicitLocale;

  const segmentLocale = await requestLocale;
  if (hasLocale(locales, segmentLocale)) return segmentLocale;

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (hasLocale(locales, cookieLocale)) return cookieLocale;

  return defaultLocale;
}
