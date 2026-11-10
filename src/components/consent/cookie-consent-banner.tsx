"use client";

import { buttonVariants } from "@/components/ui/button";
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
      // `sticky` y no `fixed`: un banner fijo se sale del flujo y queda por
      // encima del contenido. Tapaba el botón de "Confirmar y pagar" del
      // checkout, así que quien no había aceptado las cookies no podía pagar
      // sin descartarlo antes. Con `sticky` reserva su alto, sigue pegado al
      // borde inferior mientras se navega, y nunca se apoya sobre nada.
      className="sticky bottom-0 z-50 border-t border-ca-border bg-ca-surface"
      data-testid="cookie-consent"
      role="region"
    >
      <div className="ca-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ca-navy" id={headingId}>
            {t("title")}
          </p>
          <p className="mt-1 text-sm leading-6 text-ca-text-secondary">{t("description")}</p>
        </div>

        <button
          className={buttonVariants({ className: "shrink-0" })}
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
