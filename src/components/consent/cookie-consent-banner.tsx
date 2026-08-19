"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { buildCookieConsentSetCookie } from "@/lib/cookie-consent";

/**
 * Aviso de cookies. Informativo: no bloquea nada ni condiciona ninguna carga,
 * porque el sitio solo usa cookies necesarias.
 *
 * Accesibilidad: es `role="region"`, **no** `role="dialog"`. Un `dialog`
 * prometería un focus trap y un cierre con Escape que este aviso no tiene y no
 * debería tener. Tampoco lleva `aria-live`: está presente desde el primer
 * paint, no es un anuncio. Va último en el DOM para no meterse delante del
 * contenido en el orden de tabulación.
 */
export function CookieConsentBanner() {
  const t = useTranslations("Consent");
  const headingId = useId();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      aria-labelledby={headingId}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ca-border bg-white/97 backdrop-blur-md"
      role="region"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-black text-ca-navy-950" id={headingId}>
            {t("title")}
          </p>
          <p className="mt-1 text-sm leading-6 text-ca-text-secondary">{t("description")}</p>
        </div>

        <button
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-ca-control bg-ca-navy-950 px-6 text-sm font-black text-white transition hover:bg-ca-navy-800"
          onClick={() => {
            document.cookie = buildCookieConsentSetCookie();
            setDismissed(true);
          }}
          type="button"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
