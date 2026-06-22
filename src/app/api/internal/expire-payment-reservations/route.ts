import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expirePaymentReservations } from "@/lib/payment-reservations";

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

  const released = await expirePaymentReservations();
  return NextResponse.json({ ok: true, released });
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
