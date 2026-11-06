import "server-only";
import { db } from "@/lib/db";
import { getEmailProvider } from "@/lib/email";
import { buildTwoFactorCodeEmail } from "@/lib/email/templates";
import type { Locale } from "@/lib/i18n/config";
import { logError } from "@/lib/logger";
import { createTwoFactorChallenge, TWO_FACTOR_LIMITS } from "@/lib/two-factor";
import { setPendingTwoFactorCookie } from "@/lib/two-factor-cookie";

/**
 * Pedir un código: crear el desafío, mandarlo y recordar cuál es.
 *
 * Los tres pasos van juntos porque separados se desincronizan: un desafío
 * creado sin cookie deja al cliente en una pantalla que no puede resolver, y
 * una cookie escrita antes de que el correo salga manda a esperar un código que
 * nunca llegó. Lo usan el ingreso y el reenvío, que son los dos lugares desde
 * donde se pide uno.
 */
export type TwoFactorDeliveryResult = "sent" | "unavailable";

const EXPIRES_IN_MINUTES = Math.round(TWO_FACTOR_LIMITS.ttlMs / 60_000);

export async function deliverTwoFactorChallenge(
  userId: string,
  locale: Locale,
): Promise<TwoFactorDeliveryResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, isActive: true, name: true, twoFactorEnabled: true },
  });

  // Se revalida acá y no solo en quien llama: el reenvío entra con un `userId`
  // que viene de una cookie de hasta diez minutos, y en ese rato la cuenta pudo
  // apagar el segundo factor o quedar desactivada.
  if (!user || !user.isActive || !user.twoFactorEnabled) return "unavailable";

  const { challengeId, code } = await createTwoFactorChallenge(userId);

  try {
    const provider = getEmailProvider();
    await provider.sendEmail(
      buildTwoFactorCodeEmail({
        code,
        customerEmail: user.email,
        // Sin nombre se usa la parte local del correo: es el correo de quien lo
        // lee, así que lo reconoce igual.
        customerName: user.name ?? user.email.split("@")[0],
        expiresInMinutes: EXPIRES_IN_MINUTES,
        locale,
      }),
    );
  } catch (error) {
    // El fallo **no** se silencia como en "olvidé mi contraseña". Ahí el
    // silencio es a propósito, para no revelar si el correo existe; acá quien
    // pide ya probó su contraseña, no hay nada que ocultarle, y mandarlo a una
    // pantalla a escribir un código que no salió lo deja sin salida.
    logError({ context: "deliverTwoFactorChallenge", userId }, error);
    return "unavailable";
  }

  await setPendingTwoFactorCookie({ challengeId, userId });

  return "sent";
}

export const TWO_FACTOR_EXPIRES_IN_MINUTES = EXPIRES_IN_MINUTES;
