import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "@/lib/i18n/config";
import { LOCALE_COOKIE } from "@/lib/i18n/routing";

/**
 * Conmutador de idioma de la landing.
 *
 * El del sitio completo son enlaces, porque allá el idioma es la URL. Acá hay
 * una sola dirección, así que son formularios: cada uno escribe la cookie y
 * vuelve a pintar la página. Botones y no enlaces porque esto **cambia estado
 * del visitante**, y un enlace que modifica algo al seguirlo es la clase de
 * cosa que un prefetch dispara sin que nadie haya hecho clic.
 *
 * Al correr sin JavaScript sigue funcionando: es un `form` con acción de
 * servidor, que es lo que corresponde en una página que existe para que
 * alguien que llega de un anuncio escriba por WhatsApp.
 */

const LOCALE_LABELS: Record<Locale, { short: string; full: string }> = {
  es: { short: "ES", full: "Español" },
  en: { short: "EN", full: "English" },
};

/** Un año, igual que la cookie de idioma del sitio completo. */
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

async function setLandingLocale(formData: FormData) {
  "use server";

  const requested = String(formData.get("locale") ?? "");
  // El valor viene de un formulario: se contrasta contra la lista en vez de
  // confiar en él, o cualquiera escribiría cualquier cosa en la cookie.
  if (!(locales as readonly string[]).includes(requested)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, requested, {
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/");
}

export function LandingLocaleSwitch({ current, label }: { current: Locale; label: string }) {
  return (
    <form action={setLandingLocale} aria-label={label} className="landing-locale">
      {locales.map((locale) => (
        <button
          aria-current={locale === current ? "true" : undefined}
          className={locale === current ? "is-current" : undefined}
          key={locale}
          name="locale"
          title={LOCALE_LABELS[locale].full}
          type="submit"
          value={locale}
        >
          {LOCALE_LABELS[locale].short}
        </button>
      ))}
    </form>
  );
}
