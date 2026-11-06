import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import { LOCALE_COOKIE } from "@/lib/i18n/routing";

/**
 * Idioma de la landing.
 *
 * El sitio completo lleva el idioma en la URL —`/es/...` y `/en/...`— pero en
 * modo landing esas rutas no existen: `pageExtensions` deja solo los archivos
 * `*.landing.tsx` y queda una única página en `/`. Así que acá el idioma viene
 * de la cookie que la internacionalización ya define, y no del camino.
 *
 * **Lo que eso cuesta:** las dos versiones comparten una dirección, así que un
 * buscador indexa solo la que sirve por defecto. Es lo mismo que pasa hoy
 * —la landing es solo en español— y no empeora nada, pero si se quiere la
 * versión en inglés indexada hay que darle una URL propia, lo que choca con
 * que el modo landing sea una sola página.
 *
 * Sin cookie se negocia con `Accept-Language`, igual que hace el ruteo en la
 * primera visita del sitio completo.
 */
export async function resolveLandingLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(LOCALE_COOKIE)?.value;

  if (isSupported(stored)) return stored;

  const headerStore = await headers();
  return negotiateLocale(headerStore.get("accept-language"));
}

function isSupported(value: string | undefined): value is Locale {
  return Boolean(value) && (locales as readonly string[]).includes(value as string);
}

/**
 * Elige el idioma con mayor calidad declarada.
 *
 * Se mira solo la etiqueta primaria (`en` de `en-US`): la landing no distingue
 * variantes regionales y tratarlas como idiomas distintos solo produciría
 * fallos al no encontrar coincidencia exacta.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...rest] = part.trim().split(";");
      const quality = rest
        .map((token) => token.trim())
        .find((token) => token.startsWith("q="));

      return {
        primary: tag.trim().toLowerCase().split("-")[0],
        // Sin `q=` la calidad es 1 por especificación.
        quality: quality ? Number(quality.slice(2)) : 1,
      };
    })
    .filter((entry) => Number.isFinite(entry.quality) && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const entry of ranked) {
    if (isSupported(entry.primary)) return entry.primary;
  }

  return defaultLocale;
}
