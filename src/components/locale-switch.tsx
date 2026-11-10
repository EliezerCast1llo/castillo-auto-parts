"use client";

/**
 * Conmutador de idioma.
 *
 * La internacionalización llegó con rutas, mensajes y cookie, pero sin ningún
 * control para cambiar de idioma: a `/en` solo se llegaba escribiéndolo o
 * negociándolo en la primera visita. Esto es ese control.
 *
 * Es un cliente porque necesita la ruta actual, y son **enlaces** y no un
 * botón que empuja: así el idioma sigue siendo la URL —que es la fuente de
 * verdad del ruteo— y el buscador ve dos direcciones reales en vez de una que
 * cambia sola. También deja abrir el otro idioma en otra pestaña.
 *
 * `usePathname` de next-intl devuelve la ruta **interna** (`/help`, no
 * `/ayuda`), y el `Link` con `locale` la vuelve a escribir en la grafía del
 * destino. Por eso `/es/ayuda` lleva a `/en/help` sin una tabla aparte.
 */

import { useParams } from "next/navigation";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { locales, type Locale } from "@/lib/i18n/config";

/** Etiqueta corta por idioma. El nombre va en su propio idioma, no traducido. */
const LOCALE_LABELS: Record<Locale, { short: string; full: string }> = {
  es: { short: "ES", full: "Español" },
  en: { short: "EN", full: "English" },
};

type LocaleSwitchProps = {
  current: Locale;
  /** Etiqueta accesible del grupo, ya traducida por quien lo monta. */
  label: string;
  /**
   * El cabezal tiene dos fondos —la barra superior es oscura y el cabezal fijo
   * es blanco— y el mismo gris claro se pierde en uno de los dos.
   */
  tone?: "onDark" | "onLight";
};

const TONE_CLASSES = {
  onDark: { current: "text-white", other: "text-white/60 hover:text-white" },
  onLight: {
    current: "text-ca-navy",
    other: "text-ca-text-secondary hover:text-ca-navy",
  },
} as const;

export function LocaleSwitch({ current, label, tone = "onDark" }: LocaleSwitchProps) {
  const pathname = usePathname();
  // Las rutas dinámicas necesitan sus parámetros para reescribirse: sin esto,
  // `/es/vehiculos/toyota` perdería la marca al cambiar de idioma.
  const params = useParams();

  return (
    <nav aria-label={label} className="flex items-center gap-0.5">
      {locales.map((locale) => {
        const isCurrent = locale === current;

        return (
          <Link
            aria-current={isCurrent ? "true" : undefined}
            className={`inline-flex min-h-11 items-center rounded px-1.5 text-xs font-bold transition ${
 isCurrent ? TONE_CLASSES[tone].current : TONE_CLASSES[tone].other
 }`}
            // El `href` sale de la ruta actual; `params` reconstruye los
            // segmentos dinámicos que `usePathname` ya resolvió.
            href={{ pathname, params } as never}
            hrefLang={locale}
            key={locale}
            locale={locale}
            // `prefetch={false}`: son dos enlaces en cada página del sitio y
            // casi nadie cambia de idioma. Precargarlos descargaría la versión
            // en el otro idioma de cada página que alguien visite.
            prefetch={false}
            title={LOCALE_LABELS[locale].full}
          >
            {LOCALE_LABELS[locale].short}
          </Link>
        );
      })}
    </nav>
  );
}
