import { getTranslations } from "next-intl/server";
import type { Locale } from "./config";

/**
 * Áreas con su propio juego de códigos.
 *
 * La cuenta separa éxito de error porque la UI los pinta distinto: el tono es
 * parte del dato, no del componente.
 */
type StatusArea = "auth" | "account.success" | "account.error" | "checkout";

/**
 * Traduce un código de `?estado=` al texto que ve el cliente.
 *
 * Las server actions redirigen con códigos y no con mensajes, así que el código
 * ya era una clave independiente del idioma: acá solo se le busca traducción.
 * Eso reemplaza los mappers que cada página tenía copiados, donde
 * `weak_password`, `password_mismatch` y `rate_limited` estaban escritos tres
 * veces con el mismo texto.
 *
 * Los códigos se agrupan por área porque **el mismo código significa cosas
 * distintas según dónde aparezca**: `invalid` es "email o contraseña
 * incorrectos" en el login y "revisa los datos del formulario" en el checkout.
 * Un namespace plano los habría mezclado en silencio.
 *
 * El idioma se recibe y no se deduce: `getLocale()` resuelve el segmento de
 * forma poco confiable en componentes anidados, y ahí falla en silencio —
 * devuelve el idioma por defecto y el texto sale en español sin que nada avise.
 *
 * Un código desconocido devuelve `""`, que es como la UI representa "sin
 * mensaje": el query param lo controla quien navega y no debe romper la página.
 */
export async function getStatusMessage(
  area: StatusArea,
  code: string | undefined,
  locale: Locale,
): Promise<string> {
  if (!code) return "";

  const t = await getTranslations({ locale, namespace: `Status.${area}` });

  // El código viene de la URL: es un string cualquiera, no una de las claves que
  // conoce el tipo. `has` es la comprobación real y corre en runtime; el cast
  // solo le dice a TypeScript que la clave ya se validó.
  const catalog = t as unknown as {
    (key: string): string;
    has(key: string): boolean;
  };

  return catalog.has(code) ? catalog(code) : "";
}
