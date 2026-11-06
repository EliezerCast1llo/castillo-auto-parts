import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Códigos de segundo factor por correo.
 *
 * El código es de seis dígitos porque se tipea desde el teléfono, y eso fija
 * todo lo demás: 10^6 combinaciones son forzables, así que la seguridad no
 * viene de la longitud sino de tres límites que se aplican juntos —vida corta,
 * intentos contados y un solo uso—. Sacar cualquiera de los tres deja el resto
 * sin sentido.
 */

/** Diez minutos: alcanza para ir al correo y volver, no para un ataque. */
const CHALLENGE_TTL_MS = 10 * 60 * 1000;

/**
 * Cinco intentos por desafío.
 *
 * Con 10^6 combinaciones, cinco intentos dan una probabilidad de acierto de
 * 1 en 200.000 por desafío. El rate limit del endpoint es la otra mitad: sin
 * él, pedir desafíos nuevos en serie convierte el tope en un trámite.
 */
const MAX_ATTEMPTS = 5;

const CODE_LENGTH = 6;

export type TwoFactorChallengeRef = {
  challengeId: string;
  code: string;
};

export type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_found" | "expired" | "consumed" | "too_many_attempts" | "mismatch" };

/**
 * Clave del HMAC.
 *
 * Un hash simple de seis dígitos se revierte con una tabla de un millón de
 * entradas, así que hashear sin clave no protegería nada ante una filtración de
 * la base. Con HMAC, el atacante necesita además el secreto del servidor.
 *
 * Se reusa el secreto de Auth.js porque ya está validado en producción —el
 * arranque falla si falta o es débil— y agregar otra variable sería una pieza
 * más que alguien puede olvidar de configurar.
 */
function codeSecret() {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || "";

  if (!secret) {
    throw new Error(
      "AUTH_SECRET/NEXTAUTH_SECRET es necesario para hashear los códigos de segundo factor.",
    );
  }

  return secret;
}

function hashCode(code: string) {
  return createHmac("sha256", codeSecret()).update(code).digest("base64url");
}

/**
 * Genera el código.
 *
 * `randomInt` y no `Math.random`: es el generador criptográfico del runtime, y
 * un código adivinable vuelve decorativo todo lo demás. El relleno con ceros
 * importa — sin él, "001234" saldría como "1234" y el rango real se encogería.
 */
function generateCode() {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

/**
 * Crea un desafío y devuelve el código en claro, una sola vez.
 *
 * El código en claro no se guarda ni se registra: viaja al correo y se olvida.
 * Quien llame a esto es responsable de mandarlo y de no loguearlo.
 *
 * Los desafíos anteriores del mismo usuario se consumen: si no, pedir un código
 * nuevo dejaría el viejo vivo y cada pedido sumaría una ventana más de cinco
 * intentos sobre la misma cuenta.
 */
export async function createTwoFactorChallenge(userId: string): Promise<TwoFactorChallengeRef> {
  const code = generateCode();

  const challenge = await db.$transaction(async (tx) => {
    await tx.twoFactorChallenge.updateMany({
      data: { consumedAt: new Date() },
      where: { consumedAt: null, userId },
    });

    return tx.twoFactorChallenge.create({
      data: {
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
        userId,
      },
      select: { id: true },
    });
  });

  return { challengeId: challenge.id, code };
}

/**
 * Verifica un código y, si es correcto, consume el desafío.
 *
 * El intento se cuenta **antes** de comparar: si se contara después, abortar la
 * petición a mitad dejaría intentos gratis. Y el desafío se marca consumido en
 * la misma operación que lo valida, así dos envíos simultáneos del mismo código
 * no pueden crear dos sesiones.
 *
 * Los motivos se devuelven para registro interno, no para mostrarlos: decirle a
 * quien ataca si el código venció, ya se usó o simplemente no coincide le dice
 * demasiado. La interfaz muestra un mensaje único.
 */
export async function verifyTwoFactorCode(challengeId: string, code: string): Promise<VerifyResult> {
  const challenge = await db.twoFactorChallenge.findUnique({ where: { id: challengeId } });

  if (!challenge) return { ok: false, reason: "not_found" };
  if (challenge.consumedAt) return { ok: false, reason: "consumed" };
  if (challenge.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
  if (challenge.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  const updated = await db.twoFactorChallenge.update({
    data: { attempts: { increment: 1 } },
    select: { attempts: true, userId: true },
    where: { id: challengeId },
  });

  if (!matches(code, challenge.codeHash)) {
    return { ok: false, reason: "mismatch" };
  }

  // `consumedAt: null` en el where hace que la primera de dos peticiones
  // simultáneas gane y la segunda no actualice nada.
  const consumed = await db.twoFactorChallenge.updateMany({
    data: { consumedAt: new Date() },
    where: { consumedAt: null, id: challengeId },
  });

  if (consumed.count === 0) return { ok: false, reason: "consumed" };

  return { ok: true, userId: updated.userId };
}

/** Comparación en tiempo constante: la longitud se chequea antes porque `timingSafeEqual` tira si difiere. */
function matches(code: string, storedHash: string) {
  const actual = Buffer.from(hashCode(code));
  const expected = Buffer.from(storedHash);

  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

/**
 * Borra los desafíos vencidos.
 *
 * Pensado para el cron que ya expira reservas de pago: sin esto la tabla crece
 * sin techo con filas que no sirven a nadie.
 */
export async function purgeExpiredTwoFactorChallenges() {
  const { count } = await db.twoFactorChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return count;
}

export const TWO_FACTOR_LIMITS = {
  codeLength: CODE_LENGTH,
  maxAttempts: MAX_ATTEMPTS,
  ttlMs: CHALLENGE_TTL_MS,
} as const;
