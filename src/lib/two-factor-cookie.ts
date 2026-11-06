import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { requireAuthSecret } from "@/lib/auth-secret";
import { TWO_FACTOR_LIMITS } from "@/lib/two-factor";

/**
 * Cookie del desafío pendiente de segundo factor.
 *
 * Entre "la contraseña era correcta" y "el código era correcto" hay dos
 * requests, y algo tiene que recordar de qué desafío se está hablando. Esa
 * memoria no puede ser un campo del formulario: la pantalla del código también
 * ofrece reenviar, y el reenvío necesita saber **a qué cuenta** mandarlo. Un
 * `userId` que viaje en el HTML lo edita cualquiera, y con eso se pide código
 * tras código contra la cuenta ajena que se elija —el limitador de pedidos
 * cuenta por cuenta, así que el atacante elegiría a quién bloquear y a quién
 * llenarle el correo—.
 *
 * Por eso va firmada: el `userId` viene del servidor y vuelve verificado. La
 * firma **no** es lo que autentica —eso lo hace el código— pero sí es lo que
 * impide que el cliente elija los parámetros del siguiente envío.
 *
 * No se borra al entrar: `signIn` termina lanzando un redirect y después de eso
 * no hay dónde escribir. Queda inerte igual, porque el desafío es de un solo
 * uso y la cookie muere con él (`maxAge` es la misma vida del desafío).
 */
export const PENDING_TWO_FACTOR_COOKIE = "castillo_pending_2fa";

const VERSION = "v1";

/**
 * Prefijo de dominio del mensaje.
 *
 * El mismo secreto firma esta cookie y hashea los códigos. Separar los dominios
 * cuesta una constante y evita toda la familia de ataques donde la salida de un
 * uso del secreto se presenta como válida en el otro.
 */
const MESSAGE_DOMAIN = "2fa-pending";

const CLOCK_SKEW_SECONDS = 60;

/** La cookie no sobrevive al desafío: pedir uno nuevo escribe una nueva. */
const MAX_AGE_SECONDS = Math.floor(TWO_FACTOR_LIMITS.ttlMs / 1000);

export type PendingTwoFactor = {
  challengeId: string;
  userId: string;
};

// ---------------------------------------------------------------------------
// Token (funciones puras, probables sin request)
// ---------------------------------------------------------------------------

export function createPendingTwoFactorToken(
  secret: string,
  pending: PendingTwoFactor,
  nowMs = Date.now(),
): string {
  const issuedAt = Math.floor(nowMs / 1000).toString();
  const message = `${VERSION}.${issuedAt}.${pending.challengeId}.${pending.userId}`;
  return `${message}.${sign(message, secret)}`;
}

export function verifyPendingTwoFactorToken(
  token: string | undefined,
  secret: string,
  nowMs = Date.now(),
): PendingTwoFactor | null {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 5) return null;

  const [version, issuedAtStr, challengeId, userId, signature] = parts;

  if (
    version !== VERSION ||
    !issuedAtStr ||
    !challengeId ||
    !userId ||
    !signature ||
    !/^\d+$/.test(issuedAtStr)
  ) {
    return null;
  }

  const issuedAt = Number(issuedAtStr);
  if (!Number.isSafeInteger(issuedAt)) return null;

  // La ventana se chequea acá además de en la cookie: `maxAge` lo respeta el
  // navegador, no el servidor, y un cliente que no lo respete reusaría el token
  // para siempre.
  const nowSeconds = Math.floor(nowMs / 1000);
  if (issuedAt > nowSeconds + CLOCK_SKEW_SECONDS) return null;
  if (nowSeconds - issuedAt > MAX_AGE_SECONDS) return null;

  const message = `${VERSION}.${issuedAtStr}.${challengeId}.${userId}`;
  if (!signatureMatches(message, secret, signature)) return null;

  return { challengeId, userId };
}

function sign(message: string, secret: string) {
  return createHmac("sha256", secret).update(`${MESSAGE_DOMAIN}.${message}`).digest("base64url");
}

function signatureMatches(message: string, secret: string, signature: string) {
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(message, secret));

  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

// ---------------------------------------------------------------------------
// Cookie
// ---------------------------------------------------------------------------

export async function setPendingTwoFactorCookie(pending: PendingTwoFactor): Promise<void> {
  const secret = requireAuthSecret("firmar la cookie del segundo factor");
  const cookieStore = await cookies();

  cookieStore.set(PENDING_TWO_FACTOR_COOKIE, createPendingTwoFactorToken(secret, pending), {
    httpOnly: true,
    maxAge: MAX_AGE_SECONDS,
    path: "/",
    // `strict` y no `lax`: esta cookie solo tiene sentido en la navegación que
    // la acaba de crear, y ningún sitio externo debería poder adjuntarla.
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function readPendingTwoFactorCookie(): Promise<PendingTwoFactor | null> {
  const secret = requireAuthSecret("leer la cookie del segundo factor");
  const cookieStore = await cookies();

  return verifyPendingTwoFactorToken(cookieStore.get(PENDING_TWO_FACTOR_COOKIE)?.value, secret);
}

export async function clearPendingTwoFactorCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_TWO_FACTOR_COOKIE);
}

export const PENDING_TWO_FACTOR_MAX_AGE_SECONDS = MAX_AGE_SECONDS;
