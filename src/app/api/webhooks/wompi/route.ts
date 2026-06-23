import { NextResponse } from "next/server";
import { processPaymentWebhookEvent } from "@/lib/payment-events";
import {
  getPaymentProvider,
  getWompiConfig,
  InvalidWompiWebhookSignatureError,
} from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const config = getWompiConfig();
    const provider = getPaymentProvider("wompi");
    const event = await provider.verifyWebhook(request);
    const result = await processPaymentWebhookEvent(event, {
      expectedProduction: config.environment === "production",
    });

    if (result.status === "invalid") {
      return NextResponse.json({ ok: false, reason: result.reason }, { status: 400 });
    }
    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, reason: result.reason }, { status: 404 });
    }
    if (result.status === "rejected") {
      return NextResponse.json({ ok: false, reason: result.reason }, { status: 422 });
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    if (error instanceof InvalidWompiWebhookSignatureError) {
      return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 401 });
    }

    return NextResponse.json({ ok: false, reason: "webhook_unavailable" }, { status: 503 });
  }
}
