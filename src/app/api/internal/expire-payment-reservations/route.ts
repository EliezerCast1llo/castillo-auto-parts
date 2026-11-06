import { checkPendingPaymentBacklog } from "@/lib/pending-payment-monitoring";
import { logError, logInfo, observeOperation } from "@/lib/logger";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expirePaymentReservations } from "@/lib/payment-reservations";
import { purgeExpiredTwoFactorChallenges } from "@/lib/two-factor";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return expireReservations(request);
}

export async function POST(request: Request) {
  return expireReservations(request);
}

async function expireReservations(request: Request) {
  const secret = process.env.RESERVATION_CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }
  if (!isValidBearerToken(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  // Accept only the authenticated scheduler's generated UUID, never arbitrary text.
  const incomingId = request.headers.get("x-correlation-id") ?? "";
  const correlationId = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(incomingId) ? incomingId : crypto.randomUUID();
  return observeOperation("reservation_cron", async () => {
    await checkPendingPaymentBacklog();
    const released = await expirePaymentReservations();
    const purgedTwoFactorChallenges = await purgeTwoFactorChallenges();
    await logInfo({ context: "reservation_cron", outcome: "completed" });
    return NextResponse.json(
      { ok: true, purgedTwoFactorChallenges, released },
      { headers: { "x-correlation-id": correlationId } },
    );
  }, correlationId);
}

/**
 * Limpieza de los desafíos de segundo factor vencidos.
 *
 * Viaja en este cron porque es el único que ya corre cada cinco minutos y está
 * autenticado; montar un segundo horario para borrar filas muertas sería una
 * pieza más que configurar en cada despliegue.
 *
 * Va aislada: lo importante de este endpoint es liberar reservas de pago, y una
 * excepción acá —la tabla todavía sin migrar, por ejemplo— no puede dejar las
 * reservas sin expirar. Devuelve `null` cuando falla para que la respuesta
 * distinga "no borró nada" de "no pudo".
 */
async function purgeTwoFactorChallenges(): Promise<number | null> {
  try {
    return await purgeExpiredTwoFactorChallenges();
  } catch (error) {
    await logError({ context: "reservation_cron.purge_two_factor" }, error);
    return null;
  }
}

export function isValidBearerToken(authorization: string | null, secret: string) {
  if (!authorization?.startsWith("Bearer ")) return false;
  const provided = authorization.slice("Bearer ".length);
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(secret);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}
