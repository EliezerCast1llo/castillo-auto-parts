import { hasAcceptedCookies } from "@/lib/cookie-consent-server";
import { CookieConsentBanner } from "./cookie-consent-banner";

/**
 * Decide en el servidor si el aviso se renderiza.
 *
 * Ese es el punto: el HTML inicial ya viene correcto, así que no hay flash del
 * banner ni desajuste de hidratación. La alternativa habitual —renderizar
 * siempre y esconderlo en un `useEffect`— hace parpadear el aviso a quien ya lo
 * aceptó.
 */
export async function CookieConsentSlot() {
  if (await hasAcceptedCookies()) return null;

  return <CookieConsentBanner />;
}
