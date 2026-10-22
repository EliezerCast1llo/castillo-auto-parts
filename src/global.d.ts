import type { formats } from "@/lib/i18n/formats";
import type esMessages from "@/lib/i18n/messages/es";
import type { routing } from "@/lib/i18n/routing";

/**
 * Tipado del catálogo de mensajes.
 *
 * El español es la fuente de tipos porque se escribe primero y siempre está
 * completo. Con esto `t("Common.retry")` autocompleta y una clave inexistente
 * no compila.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof esMessages;
    Formats: typeof formats;
  }
}
