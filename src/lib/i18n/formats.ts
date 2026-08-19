import type { Formats } from "next-intl";
import { APP_CURRENCY } from "./intl-locale";

/**
 * Formatos compartidos para `useFormatter()` / `getFormatter()`.
 *
 * Centralizarlos evita que cada componente invente su propio
 * `Intl.DateTimeFormat`, que es exactamente el problema que había antes:
 * un formateador compartido y cuatro copias inline divergiendo.
 */
export const formats = {
  dateTime: {
    short: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
    long: {
      dateStyle: "medium",
      timeStyle: "short",
    },
  },
  number: {
    currency: {
      style: "currency",
      currency: APP_CURRENCY,
    },
  },
} satisfies Formats;
