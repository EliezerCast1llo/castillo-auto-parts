import "server-only";
import { cookies } from "next/headers";
import {
  COOKIE_CONSENT_COOKIE,
  hasAcceptedCurrentConsent,
  parseCookieConsent,
} from "./cookie-consent";

/** true si el visitante ya aceptó el aviso de cookies en su versión vigente. */
export async function hasAcceptedCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  return hasAcceptedCurrentConsent(parseCookieConsent(cookieStore.get(COOKIE_CONSENT_COOKIE)?.value));
}
